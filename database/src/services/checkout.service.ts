import * as admin from "firebase-admin";
import { getDb } from "../config/firebase";
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  Address,
  ShippingMethod,
  Cart,
  Product,
  Inventory,
  InventoryStatus,
  StockMovement,
  StockMovementType,
  IdempotencyRecord,
  Money,
  FlatTaxStrategy,
  USTaxStrategy,
  TaxStrategy,
  CartCalculator,
  CouponValidator,
  OrderMapper,
  IdempotencyRecordMapper,
  DateMapper,
  NotFoundError,
  ValidationError,
  InMemoryEventBus,
  OrderCreatedEvent,
  ReservationCommittedEvent,
  CouponMapper,
  PromotionMapper,
  InventoryMapper,
  StockMovementMapper,
} from "@zell/shared";
import { CatalogService } from "./catalog.service";

export class CheckoutService {
  /**
   * Places an order transactionally, enforcing stock levels, coupon validity, and idempotency protection.
   */
  public static async placeOrder(
    userId: string,
    cartId: string,
    billingAddress: Address,
    shippingAddress: Address,
    shippingMethod: ShippingMethod,
    idempotencyKey: string,
    taxStrategy: TaxStrategy = new USTaxStrategy()
  ): Promise<Order> {
    const db = getDb();
    const idempotencyRef = db.collection("idempotency").doc(idempotencyKey);
    const cartRef = db.collection("carts").doc(cartId);
    const orderRef = db.collection("orders").doc();

    const orderResult = await db.runTransaction(async (transaction) => {
      // ─── READ PHASE ──────────────────────────────────────────────────────────

      // 1. Read Idempotency Record
      const idempotencySnap = await transaction.get(idempotencyRef);
      let existingRecord: IdempotencyRecord | null = null;
      let existingOrderDoc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData> | null =
        null;

      if (idempotencySnap.exists) {
        existingRecord = IdempotencyRecordMapper.toDomain({
          key: idempotencySnap.id,
          ...idempotencySnap.data(),
        });

        if (existingRecord.status === "COMPLETED" && existingRecord.orderId) {
          existingOrderDoc = await transaction.get(
            db.collection("orders").doc(existingRecord.orderId)
          );
        }
      }

      // 2. Read Cart
      const cartSnap = await transaction.get(cartRef);

      // 3. Read Coupon and Promotion (if coupon is applied)
      let couponSnap: admin.firestore.QuerySnapshot<admin.firestore.DocumentData> | null = null;
      let promoDoc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData> | null = null;

      if (cartSnap.exists) {
        const cartData = cartSnap.data() as Cart;
        if (cartData.promoCodesApplied && cartData.promoCodesApplied.length > 0) {
          const couponCode = cartData.promoCodesApplied[0];
          const couponQuery = db.collection("coupons").where("code", "==", couponCode).limit(1);
          couponSnap = await transaction.get(couponQuery);
          if (couponSnap && !couponSnap.empty) {
            const couponData = couponSnap.docs[0].data();
            const promoRef = db.collection("promotions").doc(couponData.promoId as string);
            promoDoc = await transaction.get(promoRef);
          }
        }
      }

      // 4. Read Product Documents
      const productDocs: admin.firestore.DocumentSnapshot[] = [];
      if (cartSnap.exists) {
        const cartData = cartSnap.data() as Cart;
        const productIds = Array.from(new Set((cartData.items || []).map((i) => i.productId)));
        for (const pId of productIds) {
          const pDoc = await transaction.get(db.collection("products").doc(pId));
          productDocs.push(pDoc);
        }
      }

      // 5. Read Inventory Documents
      const inventorySnaps: admin.firestore.DocumentSnapshot[] = [];
      if (cartSnap.exists) {
        const cartData = cartSnap.data() as Cart;
        for (const item of cartData.items || []) {
          const inventoryRef = db.collection("inventory").doc(item.sku);
          const inventorySnap = await transaction.get(inventoryRef);
          inventorySnaps.push(inventorySnap);
        }
      }

      // ─── VALIDATION & WRITE PHASE ──────────────────────────────────────────

      // 1. Validate Idempotency
      if (existingRecord) {
        if (existingRecord.status === "COMPLETED" && existingRecord.orderId) {
          if (existingOrderDoc && existingOrderDoc.exists) {
            return OrderMapper.toDomain({
              id: existingOrderDoc.id,
              ...existingOrderDoc.data(),
            });
          }
        } else if (existingRecord.status === "PENDING") {
          throw new ValidationError("An order is currently being processed for this request.");
        }
      }

      // 2. Validate Cart
      if (!cartSnap.exists) {
        throw new NotFoundError("Cart not found.");
      }
      const cart = cartSnap.data() as Cart;
      if (!cart.items || cart.items.length === 0) {
        throw new ValidationError("Cannot checkout with an empty cart.");
      }

      // Parse resolved products
      const products: Product[] = [];
      for (const doc of productDocs) {
        if (doc.exists) {
          products.push({ id: doc.id, ...doc.data() } as Product);
        }
      }

      // Revalidate Pricing
      const calculation = CartCalculator.calculate(cart.items, products);

      // Validate Coupon and Promotion
      if (cart.promoCodesApplied.length > 0) {
        if (!couponSnap || couponSnap.empty) {
          throw new ValidationError(`Coupon ${cart.promoCodesApplied[0]} is invalid.`);
        }
        const couponDoc = couponSnap.docs[0];
        if (!promoDoc || !promoDoc.exists) {
          throw new ValidationError(
            `Promotion details for coupon ${cart.promoCodesApplied[0]} not found.`
          );
        }

        const coupon = CouponMapper.toDomain({ id: couponDoc.id, ...couponDoc.data() });
        const promotion = PromotionMapper.toDomain({
          id: promoDoc.id,
          ...(promoDoc.data() as Record<string, unknown>),
        });

        const couponValidation = CouponValidator.validate(coupon, promotion, calculation.subtotal);
        if (!couponValidation.isValid) {
          throw new ValidationError(`Coupon validation failed: ${couponValidation.error}`);
        }
      }

      // Write pending idempotency record
      const pendingRecord: IdempotencyRecord = {
        key: idempotencyKey,
        userId,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      };
      transaction.set(idempotencyRef, IdempotencyRecordMapper.toPersistence(pendingRecord));

      // Process items and verify stock
      const orderItems: OrderItem[] = [];
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        const inventorySnap = inventorySnaps[i];
        const inventoryRef = db.collection("inventory").doc(item.sku);

        if (!inventorySnap.exists) {
          throw new NotFoundError(`Inventory record not found for SKU: ${item.sku}`);
        }

        const inventory = InventoryMapper.toDomain({
          sku: inventorySnap.id,
          ...(inventorySnap.data() as Record<string, unknown>),
        });
        const available = inventory.quantity - inventory.reservedQuantity;

        if (available < item.quantity) {
          throw new ValidationError(
            `Insufficient stock for item: ${item.productSnapshot.title}. Available: ${available}, Requested: ${item.quantity}`
          );
        }

        // Deduct committed stock directly in the transaction
        const newQuantity = inventory.quantity - item.quantity;
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

        // Write StockMovement log under inventory movements subcollection
        const movementRef = inventoryRef.collection("movements").doc();
        const movement: StockMovement = {
          id: movementRef.id,
          sku: item.sku,
          type: StockMovementType.OUT,
          quantity: item.quantity,
          reason: `ORDER_PLACEMENT: ${orderRef.id}`,
          createdBy: userId,
          timestamp: new Date(),
        };

        transaction.set(inventoryRef, InventoryMapper.toPersistence(updatedInventory));
        transaction.set(movementRef, StockMovementMapper.toPersistence(movement));

        // Find product details for order item snapshot
        const product = products.find((p) => p.id === item.productId);
        const productSlug = product?.slug || item.productId;
        const brandName = item.productSnapshot.brandName;

        // Build immutable OrderItem Snapshot
        orderItems.push({
          productId: item.productId,
          sku: item.sku,
          productSlug,
          productName: item.productSnapshot.title,
          brandName,
          selectedVariantAttributes: item.productSnapshot.variantAttributes,
          unitPrice: calculation.itemPrices[item.sku] || item.price,
          appliedDiscounts: 0, // In cents (discount value calculated)
          currency: item.productSnapshot.currency || "USD",
          productImage: item.productSnapshot.mainImage,
          quantity: item.quantity,
        });
      }

      // Calculate Taxes & Final Totals
      const subtotalMoney = new Money(calculation.subtotal);
      const shippingMoney = new Money(shippingMethod.price);
      const taxMoney = taxStrategy.calculateTax(
        subtotalMoney,
        shippingMoney,
        shippingAddress.state || ""
      );
      const totalMoney = subtotalMoney.add(shippingMoney).add(taxMoney);

      // Create Order Document
      const now = new Date();
      const order: Order = {
        id: orderRef.id,
        userId,
        items: orderItems,
        status: OrderStatus.PENDING,
        statusHistory: [
          {
            status: OrderStatus.PENDING,
            action: "STATUS_CHANGED",
            updatedAt: now,
            updatedBy: userId,
            reason: "Order placed successfully.",
          },
        ],
        subtotal: subtotalMoney.amountInCents,
        tax: taxMoney.amountInCents,
        shipping: shippingMoney.amountInCents,
        total: totalMoney.amountInCents,
        promoCodeApplied: cart.promoCodesApplied[0] || undefined,
        billingAddress,
        shippingAddress,
        paymentStatus: PaymentStatus.PENDING,
        shipmentStatus: ShipmentStatus.PENDING,
        shippingMethod,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(orderRef, OrderMapper.toPersistence(order));

      // Complete Idempotency record
      const completedRecord: IdempotencyRecord = {
        ...pendingRecord,
        status: "COMPLETED",
        orderId: orderRef.id,
      };
      transaction.set(idempotencyRef, IdempotencyRecordMapper.toPersistence(completedRecord));

      // Delete Cart
      transaction.delete(cartRef);

      return order;
    });

    // 9. Publish Domain Events
    try {
      const eventBus = InMemoryEventBus.getInstance();
      eventBus.publish(
        new OrderCreatedEvent({
          orderId: orderResult.id,
          userId: orderResult.userId,
          total: orderResult.total,
        })
      );

      for (const item of orderResult.items) {
        eventBus.publish(
          new ReservationCommittedEvent({
            orderId: orderResult.id,
            sku: item.sku,
            quantity: item.quantity,
          })
        );
      }
    } catch (e) {
      console.error("Error publishing domain events for placed order:", e);
    }

    return orderResult;
  }
}
