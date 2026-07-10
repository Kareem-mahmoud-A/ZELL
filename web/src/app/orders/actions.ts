"use server";

import { cookies } from "next/headers";
import { Role, Order, OrderStatus, OrderStatusHistory, UnauthorizedError } from "@zell/shared";
import { OrderService } from "@zell/database";

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
    throw new UnauthorizedError("Authentication required.");
  }
  const payload = decodeJwt(session);
  if (!payload || !payload.uid) {
    throw new UnauthorizedError("Invalid session. Please log in again.");
  }
  return payload;
}

export async function getOrderAction(
  orderId: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const session = await requireSession();
    const order = await OrderService.getOrder(orderId, session.uid, session.role);
    return { success: true, order };
  } catch (error: unknown) {
    console.error("getOrderAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load order details",
    };
  }
}

export async function listUserOrdersAction(): Promise<{
  success: boolean;
  orders?: Order[];
  error?: string;
}> {
  try {
    const session = await requireSession();
    const orders = await OrderService.listUserOrders(session.uid);
    return { success: true, orders };
  } catch (error: unknown) {
    console.error("listUserOrdersAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load orders list",
    };
  }
}

export async function transitionOrderStatusAction(
  orderId: string,
  nextStatus: OrderStatus,
  action: OrderStatusHistory["action"],
  reason?: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const session = await requireSession();
    // Enforce administrative permissions
    const allowedRoles = [Role.ADMIN, Role.MERCHANT, Role.MANAGER, Role.SUPPORT];
    if (!allowedRoles.includes(session.role)) {
      throw new UnauthorizedError("Only staff members can transition order states.");
    }

    const order = await OrderService.transitionStatus(
      orderId,
      nextStatus,
      action,
      `staff:${session.uid}`,
      reason
    );

    return { success: true, order };
  } catch (error: unknown) {
    console.error("transitionOrderStatusAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order status",
    };
  }
}
