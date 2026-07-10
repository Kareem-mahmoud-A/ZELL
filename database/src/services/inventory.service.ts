import * as admin from "firebase-admin";
import { getDb } from "../config/firebase";
import {
  StockMovement,
  Inventory,
  InventoryStatus,
  StockMovementType,
  NotFoundError,
  InventoryReservation,
} from "@zell/shared";
import { InventoryMapper, StockMovementMapper, InventoryReservationMapper } from "@zell/shared";

export class InventoryService {
  /**
   * Adjust stock levels with audited StockMovement written to subcollection.
   * Subcollection path: inventory/{sku}/movements/{movementId}
   */
  public static async adjustStock(
    sku: string,
    quantityChange: number,
    reason: string,
    createdBy: string
  ): Promise<void> {
    const db = getDb();
    const inventoryRef = db.collection("inventory").doc(sku);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inventoryRef);
      if (!doc.exists) {
        throw new NotFoundError(`Inventory not found for SKU: ${sku}`);
      }

      const inventory = InventoryMapper.toDomain({ sku: doc.id, ...doc.data() } as Record<
        string,
        unknown
      >);

      const newQty = inventory.quantity + quantityChange;
      if (newQty < 0) {
        throw new Error(`Adjustment leads to negative stock for SKU: ${sku}`);
      }

      // Determine movement type
      const movementType =
        quantityChange === 0
          ? StockMovementType.ADJUSTMENT
          : quantityChange > 0
            ? StockMovementType.IN
            : StockMovementType.OUT;

      // Build movement record to write to subcollection
      const movementRef = inventoryRef.collection("movements").doc();
      const movement: StockMovement = {
        id: movementRef.id,
        sku,
        type: movementType,
        quantity: Math.abs(quantityChange),
        reason,
        createdBy,
        timestamp: new Date(),
      };

      // Compute new status
      const available = newQty - inventory.reservedQuantity;
      let newStatus = InventoryStatus.IN_STOCK;
      if (available <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (available <= inventory.lowStockThreshold) {
        newStatus = InventoryStatus.LOW_STOCK;
      }

      const updatedInventory: Inventory = {
        ...inventory,
        quantity: newQty,
        status: newStatus,
        lastUpdated: new Date(),
      };

      // Atomically: update inventory doc + write movement to subcollection
      transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
      transaction.set(movementRef, StockMovementMapper.toPersistence(movement));
    });
  }

  /**
   * Reserve inventory stock for checkout flows.
   * No movement record — reservation is not a stock change.
   */
  public static async reserveStock(sku: string, quantityToReserve: number): Promise<void> {
    const db = getDb();
    const inventoryRef = db.collection("inventory").doc(sku);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inventoryRef);
      if (!doc.exists) {
        throw new NotFoundError(`Inventory not found for SKU: ${sku}`);
      }

      const inventory = InventoryMapper.toDomain({ sku: doc.id, ...doc.data() } as Record<
        string,
        unknown
      >);

      const available = inventory.quantity - inventory.reservedQuantity;
      if (available < quantityToReserve) {
        throw new Error(
          `Insufficient stock to reserve for SKU: ${sku}. Available: ${available}, Requested: ${quantityToReserve}`
        );
      }

      const newReserved = inventory.reservedQuantity + quantityToReserve;
      const newAvailable = inventory.quantity - newReserved;

      let newStatus = InventoryStatus.IN_STOCK;
      if (newAvailable <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (newAvailable <= inventory.lowStockThreshold) {
        newStatus = InventoryStatus.LOW_STOCK;
      }

      const updatedInventory: Inventory = {
        ...inventory,
        reservedQuantity: newReserved,
        status: newStatus,
        lastUpdated: new Date(),
      };

      transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
    });
  }

  /**
   * Release reserved stock back to available.
   */
  public static async releaseStock(sku: string, quantityToRelease: number): Promise<void> {
    const db = getDb();
    const inventoryRef = db.collection("inventory").doc(sku);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inventoryRef);
      if (!doc.exists) {
        throw new NotFoundError(`Inventory not found for SKU: ${sku}`);
      }

      const inventory = InventoryMapper.toDomain({ sku: doc.id, ...doc.data() } as Record<
        string,
        unknown
      >);

      if (inventory.reservedQuantity < quantityToRelease) {
        throw new Error(
          `Cannot release more than reserved stock for SKU: ${sku}. Reserved: ${inventory.reservedQuantity}`
        );
      }

      const newReserved = inventory.reservedQuantity - quantityToRelease;
      const newAvailable = inventory.quantity - newReserved;

      let newStatus = InventoryStatus.IN_STOCK;
      if (newAvailable <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (newAvailable <= inventory.lowStockThreshold) {
        newStatus = InventoryStatus.LOW_STOCK;
      }

      const updatedInventory: Inventory = {
        ...inventory,
        reservedQuantity: newReserved,
        status: newStatus,
        lastUpdated: new Date(),
      };

      transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
    });
  }

  /**
   * Fetch paginated stock movement history from the subcollection.
   */
  public static async getMovements(
    sku: string,
    limitCount: number = 50,
    startAfterDoc?: admin.firestore.DocumentSnapshot
  ): Promise<StockMovement[]> {
    const db = getDb();
    let query = db
      .collection("inventory")
      .doc(sku)
      .collection("movements")
      .orderBy("timestamp", "desc")
      .limit(limitCount);

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) =>
      StockMovementMapper.toDomain({ id: doc.id, ...doc.data() } as Record<string, unknown>)
    );
  }

  /**
   * Reserves stock with an expiration timeout.
   * Creates an InventoryReservation document at `/reservations/{id}`.
   */
  public static async reserveStockWithTimeout(
    sku: string,
    quantity: number,
    ttlSeconds: number
  ): Promise<string> {
    const db = getDb();
    const inventoryRef = db.collection("inventory").doc(sku);
    const reservationRef = db.collection("reservations").doc();

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inventoryRef);
      if (!doc.exists) {
        throw new NotFoundError(`Inventory not found for SKU: ${sku}`);
      }

      const inventory = InventoryMapper.toDomain({ sku: doc.id, ...doc.data() } as Record<
        string,
        unknown
      >);
      const available = inventory.quantity - inventory.reservedQuantity;

      if (available < quantity) {
        throw new Error(
          `Insufficient stock to reserve SKU ${sku}. Available: ${available}, Requested: ${quantity}`
        );
      }

      // Create reservation
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const reservation: InventoryReservation = {
        id: reservationRef.id,
        sku,
        quantity,
        expiresAt,
        status: "PENDING",
        createdAt: new Date(),
      };

      // Update inventory reserved quantity
      const newReserved = inventory.reservedQuantity + quantity;
      const newAvailable = inventory.quantity - newReserved;

      let newStatus = InventoryStatus.IN_STOCK;
      if (newAvailable <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (newAvailable <= inventory.lowStockThreshold) {
        newStatus = InventoryStatus.LOW_STOCK;
      }

      const updatedInventory: Inventory = {
        ...inventory,
        reservedQuantity: newReserved,
        status: newStatus,
        lastUpdated: new Date(),
      };

      transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
      transaction.set(reservationRef, InventoryReservationMapper.toPersistence(reservation));
    });

    return reservationRef.id;
  }

  /**
   * Background task: scans and releases all expired stock reservations.
   */
  public static async releaseExpiredReservations(): Promise<number> {
    const db = getDb();
    const now = new Date();

    // Query pending reservations that are past expiresAt
    const snapshot = await db
      .collection("reservations")
      .where("status", "==", "PENDING")
      .where("expiresAt", "<=", now)
      .get();

    let releasedCount = 0;

    for (const resDoc of snapshot.docs) {
      const reservation = InventoryReservationMapper.toDomain({
        id: resDoc.id,
        ...resDoc.data(),
      } as Record<string, unknown>);

      try {
        await db.runTransaction(async (transaction) => {
          const freshResDoc = await transaction.get(resDoc.ref);
          if (!freshResDoc.exists) return;

          const freshRes = InventoryReservationMapper.toDomain({
            id: freshResDoc.id,
            ...freshResDoc.data(),
          } as Record<string, unknown>);
          if (freshRes.status !== "PENDING") return; // Already resolved

          const inventoryRef = db.collection("inventory").doc(freshRes.sku);
          const inventoryDoc = await transaction.get(inventoryRef);

          if (inventoryDoc.exists) {
            const inventory = InventoryMapper.toDomain({
              sku: inventoryDoc.id,
              ...inventoryDoc.data(),
            } as Record<string, unknown>);

            // Decrement reserved quantity, capped at 0
            const newReserved = Math.max(0, inventory.reservedQuantity - freshRes.quantity);
            const newAvailable = inventory.quantity - newReserved;

            let newStatus = InventoryStatus.IN_STOCK;
            if (newAvailable <= 0) {
              newStatus = InventoryStatus.OUT_OF_STOCK;
            } else if (newAvailable <= inventory.lowStockThreshold) {
              newStatus = InventoryStatus.LOW_STOCK;
            }

            const updatedInventory: Inventory = {
              ...inventory,
              reservedQuantity: newReserved,
              status: newStatus,
              lastUpdated: new Date(),
            };

            transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
          }

          // Mark reservation expired
          const updatedReservation: InventoryReservation = {
            ...freshRes,
            status: "EXPIRED",
          };

          transaction.set(resDoc.ref, InventoryReservationMapper.toPersistence(updatedReservation));
        });

        releasedCount++;
      } catch (error) {
        console.error(`Failed to release reservation ${reservation.id}:`, error);
      }
    }

    return releasedCount;
  }
}
