import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * 1. checkoutCart
 * Validates inventory, checks payment credentials, processes Stripe charge,
 * updates inventory, and creates order records.
 */
export const checkoutCart = onCall(async (request) => {
  // Check auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required to place an order.");
  }

  const { cartId, shippingAddress, paymentMethodId, promoCode } = request.data;
  if (!cartId || !shippingAddress || !paymentMethodId) {
    throw new HttpsError("invalid-argument", "Missing required checkout parameters.");
  }

  // Audit transaction parameters
  console.info(`Checkout cart initiated: Cart ID = ${cartId}, User ID = ${request.auth.uid}`);
  console.info(`Promo Code: ${promoCode || "None"}`);

  // Placeholder logic: return mock successful checkout response
  return {
    success: true,
    orderId: `ord_mock_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    transactionId: `txn_mock_${Math.random().toString(36).substring(2, 9)}`,
    grandTotal: 120.0,
  };
});

/**
 * 2. applyPromotion
 * Validates promotional codes against a cart.
 */
export const applyPromotion = onCall(async (request) => {
  const { promoCode, cartId } = request.data;
  if (!promoCode || !cartId) {
    throw new HttpsError("invalid-argument", "Promo code and cart ID are required.");
  }

  console.info(`Validating promo code: ${promoCode} for cart: ${cartId}`);

  if (promoCode.toUpperCase() === "SUMMER10") {
    return {
      valid: true,
      discountAmount: 10.0,
      discountType: "percentage",
      message: "Promotion applied successfully.",
    };
  }

  throw new HttpsError("not-found", "Invalid promotion code.");
});

/**
 * 3. refundOrder
 * Executes payment reversal and restocks variant inventory.
 * Admin role access required.
 */
export const refundOrder = onCall(async (request) => {
  // Verify admin access claim
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Only merchants can issue refunds.");
  }

  const { orderId, refundItems, reason } = request.data;
  if (!orderId || !refundItems || refundItems.length === 0) {
    throw new HttpsError("invalid-argument", "Order ID and refund item details are required.");
  }

  console.info(
    `Refunding order: ${orderId} for items: ${JSON.stringify(refundItems)}. Reason: ${reason || "Not specified"}`
  );

  return {
    success: true,
    refundId: `ref_mock_${Math.random().toString(36).substring(2, 9)}`,
    amountRefunded: 120.0,
  };
});
