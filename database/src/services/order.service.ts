import * as admin from "firebase-admin";
import { getDb } from "../config/firebase";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  Role,
  Inventory,
  InventoryStatus,
  StockMovement,
  StockMovementType,
  OrderStatusHistory,
  OrderMapper,
  OrderStateMachine,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  InMemoryEventBus,
  OrderCancelledEvent,
  ReservationReleasedEvent,
  InventoryMapper,
  StockMovementMapper,
} from "@zell/shared";

export class OrderService {
  /**
   * Retrieves an order with access authorization checks.
   */
  public static async getOrder(orderId: string, userId: string, role: Role): Promise<Order> {
    const db = getDb();
    const doc = await db.collection("orders").doc(orderId).get();
    if (!doc.exists) {
      throw new NotFoundError(`Order not found with ID: ${orderId}`);
    }

    const order = OrderMapper.toDomain({ id: doc.id, ...doc.data() });

    // Enforce RBAC ownership bounds
    const isOwner = order.userId === userId;
    const isStaff = [Role.ADMIN, Role.MERCHANT, Role.MANAGER, Role.SUPPORT].includes(role);

    if (!isOwner && !isStaff) {
      throw new UnauthorizedError("You are not authorized to view this order.");
    }

    return order;
  }

  /**
   * Lists all orders placed by a specific user.
   */
  public static async listUserOrders(userId: string): Promise<Order[]> {
    const db = getDb();
    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => OrderMapper.toDomain({ id: doc.id, ...doc.data() }));
  }

  /**
   * Lists orders for administrative panels (paginated / limited).
   */
  public static async adminListOrders(limitCount: number = 50): Promise<Order[]> {
    const db = getDb();
    const snapshot = await db
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => OrderMapper.toDomain({ id: doc.id, ...doc.data() }));
  }

  /**
   * Transitions an order status through state machine rules and applies restocking actions on cancellation.
   */
  public static async transitionStatus(
    orderId: string,
    nextStatus: OrderStatus,
    action: OrderStatusHistory["action"],
    updatedBy: string,
    reason?: string
  ): Promise<Order> {
    const db = getDb();
    const orderRef = db.collection("orders").doc(orderId);

    const updatedOrder = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(orderRef);
      if (!doc.exists) {
        throw new NotFoundError(`Order not found with ID: ${orderId}`);
      }

      const order = OrderMapper.toDomain({ id: doc.id, ...doc.data() });

      // State machine validation
      OrderStateMachine.validateTransition(order.status, nextStatus);

      // Handle contextual flags based on status updates
      let paymentStatus = order.paymentStatus;
      let shipmentStatus = order.shipmentStatus;

      if (nextStatus === OrderStatus.PAID) {
        paymentStatus = PaymentStatus.COMPLETED;
      } else if (nextStatus === OrderStatus.SHIPPED) {
        shipmentStatus = ShipmentStatus.IN_TRANSIT;
      } else if (nextStatus === OrderStatus.DELIVERED) {
        shipmentStatus = ShipmentStatus.DELIVERED;
      } else if (nextStatus === OrderStatus.CANCELLED) {
        // If order was paid, mark refunded or just cancelled
        if (order.status === OrderStatus.PAID || order.status === OrderStatus.PROCESSING) {
          paymentStatus = PaymentStatus.REFUNDED;
        }
        shipmentStatus = ShipmentStatus.RETURNED;

        // RESTOCK INVENTORY: loop and add quantities back
        for (const item of order.items) {
          const inventoryRef = db.collection("inventory").doc(item.sku);
          const inventorySnap = await transaction.get(inventoryRef);

          if (inventorySnap.exists) {
            const inventory = InventoryMapper.toDomain({
              sku: inventorySnap.id,
              ...(inventorySnap.data() as Record<string, unknown>),
            });

            const newQuantity = inventory.quantity + item.quantity;
            const newAvailable = newQuantity - inventory.reservedQuantity;

            let newStatus = InventoryStatus.IN_STOCK;
            if (newAvailable <= 0) {
              newStatus = InventoryStatus.OUT_OF_STOCK;
            } else if (newAvailable <= inventory.lowStockThreshold) {
              newStatus = InventoryStatus.LOW_STOCK;
            }

            const updatedInventory: Inventory = {
              sku: item.sku,
              productId: inventory.productId,
              quantity: newQuantity,
              reservedQuantity: inventory.reservedQuantity,
              reorderPoint: inventory.reorderPoint,
              lowStockThreshold: inventory.lowStockThreshold,
              status: newStatus,
              lastUpdated: new Date(),
            };

            const movementRef = inventoryRef.collection("movements").doc();
            const movement: StockMovement = {
              id: movementRef.id,
              sku: item.sku,
              type: StockMovementType.IN,
              quantity: item.quantity,
              reason: `ORDER_CANCELLED_RESTOCK: ${orderId}`,
              createdBy: updatedBy,
              timestamp: new Date(),
            };

            transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
            transaction.set(movementRef, StockMovementMapper.toPersistence(movement));
          }
        }
      } else if (nextStatus === OrderStatus.REFUNDED) {
        paymentStatus = PaymentStatus.REFUNDED;
      }

      // Append state logs
      const historyEntry: OrderStatusHistory = {
        status: nextStatus,
        action,
        updatedAt: new Date(),
        updatedBy,
        reason,
      };

      const revisedOrder: Order = {
        ...order,
        status: nextStatus,
        statusHistory: [...order.statusHistory, historyEntry],
        paymentStatus,
        shipmentStatus,
        updatedAt: new Date(),
      };

      transaction.set(orderRef, OrderMapper.toPersistence(revisedOrder));
      return revisedOrder;
    });

    // Publish domain events
    try {
      const eventBus = InMemoryEventBus.getInstance();
      if (nextStatus === OrderStatus.CANCELLED) {
        eventBus.publish(new OrderCancelledEvent({ orderId, reason }));
        for (const item of updatedOrder.items) {
          eventBus.publish(
            new ReservationReleasedEvent({
              sku: item.sku,
              quantity: item.quantity,
              reason: `ORDER_CANCELLED: ${reason || "No reason provided"}`,
            })
          );
        }
      }
    } catch (e) {
      console.error("Error publishing cancellation event:", e);
    }

    return updatedOrder;
  }
}
