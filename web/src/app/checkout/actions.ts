"use server";

import { cookies } from "next/headers";
import { Role, Address, ShippingMethod, Order, UnauthorizedError } from "@zell/shared";
import { CheckoutService } from "@zell/database";

interface UserSessionPayload {
  uid: string;
  role: Role;
}

function decodeJwt(token: string): UserSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return payload as UserSessionPayload;
  } catch {
    return null;
  }
}

async function requireSession(): Promise<UserSessionPayload> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    throw new UnauthorizedError("Authentication required. Please log in to complete checkout.");
  }
  const payload = decodeJwt(session);
  if (!payload || !payload.uid) {
    throw new UnauthorizedError("Invalid session. Please log in again.");
  }
  return payload;
}

export async function placeOrderAction(
  billingAddress: Address,
  shippingAddress: Address,
  shippingMethod: ShippingMethod,
  idempotencyKey: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const session = await requireSession();
    // In our system, the authenticated user's cart ID matches their user ID
    const cartId = session.uid;

    const order = await CheckoutService.placeOrder(
      session.uid,
      cartId,
      billingAddress,
      shippingAddress,
      shippingMethod,
      idempotencyKey
    );

    return { success: true, order };
  } catch (error: unknown) {
    console.error("placeOrderAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to place order",
    };
  }
}
