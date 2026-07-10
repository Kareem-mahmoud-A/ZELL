import { getDb } from "../config/firebase";
import * as admin from "firebase-admin";

export class OrderService {
  public static async placeOrderTransaction(
    orderId: string,
    userId: string,
    items: { productId: string; sku: string; quantity: number }[],
    orderData: any
  ): Promise<void> {
    const db = getDb();

    await db.runTransaction(async (transaction) => {
      // 1. Verify and decrement stock for each variant nested in products
      for (const item of items) {
        const productRef = db.collection("products").doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const productData = productDoc.data();
        const variants = productData?.variants || [];
        const variantIndex = variants.findIndex((v: any) => v.sku === item.sku);

        if (variantIndex === -1) {
          throw new Error(`Variant not found: ${item.sku}`);
        }

        const variant = variants[variantIndex];
        if (variant.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for SKU ${item.sku}. Available: ${variant.stockQuantity}, Requested: ${item.quantity}`
          );
        }

        // Decrement stock in array map
        variants[variantIndex].stockQuantity -= item.quantity;
        transaction.update(productRef, {
          variants,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 2. Create the order document
      const orderRef = db.collection("orders").doc(orderId);
      transaction.set(orderRef, {
        ...orderData,
        id: orderId,
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
}

export * from "./catalog.service";
export * from "./inventory.service";
export * from "./cart.service";
export * from "./wishlist.service";
