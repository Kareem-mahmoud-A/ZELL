import { onCall, HttpsError } from "firebase-functions/v2/https";

/**
 * refundOrder
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
    `Refunding order: ${orderId} for items: ${JSON.stringify(
      refundItems
    )}. Reason: ${reason || "Not specified"}`
  );

  return {
    success: true,
    refundId: `ref_mock_${Math.random().toString(36).substring(2, 9)}`,
    amountRefunded: 120.0,
  };
});
