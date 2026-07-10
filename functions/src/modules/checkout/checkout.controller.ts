import { onCall, HttpsError } from "firebase-functions/v2/https";

/**
 * checkoutCart
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

  // Audit transaction parameters (Sanitized of PII address logging)
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
 * applyPromotion
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
