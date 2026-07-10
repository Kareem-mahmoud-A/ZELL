import { getDb } from "../config/firebase";
import { StockMovement, Inventory, InventoryStatus, StockMovementType } from "@zell/shared";
import { InventoryMapper } from "@zell/shared";

export class InventoryService {
  /**
   * Adjust stock levels with audited StockMovement details.
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
        throw new Error(`Inventory not found for SKU: ${sku}`);
      }

      const rawData = { sku: doc.id, ...doc.data() };
      const inventory = InventoryMapper.toDomain(rawData) as Inventory;

      const newQty = inventory.quantity + quantityChange;
      if (newQty < 0) {
        throw new Error(`Adjustment leads to negative stock for SKU: ${sku}`);
      }

      // 1. Create StockMovement audit entry
      const movementId = db.collection("inventory").doc().id;
      const movementType = quantityChange >= 0 ? StockMovementType.IN : StockMovementType.OUT;
      const movement: StockMovement = {
        id: movementId,
        sku,
        type: movementType,
        quantity: Math.abs(quantityChange),
        reason,
        createdBy,
        timestamp: new Date(),
      };

      // 2. Determine low stock status
      const available = newQty - inventory.reservedQuantity;
      let newStatus = InventoryStatus.IN_STOCK;
      if (available <= 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (available <= inventory.lowStockThreshold) {
        newStatus = InventoryStatus.LOW_STOCK;
      }

      // 3. Commit update
      const movements = [...(inventory.movements || []), movement];
      const updatedInventory: Inventory = {
        ...inventory,
        quantity: newQty,
        status: newStatus,
        movements,
        lastUpdated: new Date(),
      };

      transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
    });
  }

  /**
   * Reserve inventory stock for checkout flows.
   */
  public static async reserveStock(sku: string, quantityToReserve: number): Promise<void> {
    const db = getDb();
    const inventoryRef = db.collection("inventory").doc(sku);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inventoryRef);
      if (!doc.exists) {
        throw new Error(`Inventory not found for SKU: ${sku}`);
      }

      const rawData = { sku: doc.id, ...doc.data() };
      const inventory = InventoryMapper.toDomain(rawData) as Inventory;

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
   * Release reserved stock back to available stock.
   */
  public static async releaseStock(sku: string, quantityToRelease: number): Promise<void> {
    const db = getDb();
    const inventoryRef = db.collection("inventory").doc(sku);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inventoryRef);
      if (!doc.exists) {
        throw new Error(`Inventory not found for SKU: ${sku}`);
      }

      const rawData = { sku: doc.id, ...doc.data() };
      const inventory = InventoryMapper.toDomain(rawData) as Inventory;

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
}
