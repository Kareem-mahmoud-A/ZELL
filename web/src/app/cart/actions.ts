"use server";

import { cookies } from "next/headers";
import * as crypto from "crypto";
import { Role, Cart, CartItem, NotFoundError } from "@zell/shared";
import { CartService, CatalogService } from "@zell/database";

interface UserSessionPayload {
  uid: string;
  role: Role;
}

function decodeJwt(token: string): UserSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8")) as UserSessionPayload;
  } catch {
    return null;
  }
}

/** Helper to retrieve the authenticated user's ID from session cookie. */
async function getUserIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  const payload = decodeJwt(session);
  return payload?.uid || null;
}

/** Retrieves or securely creates guest identifiers in cookies if no auth session exists. */
async function getOrCreateCartSession(): Promise<{ cartId: string; plainGuestToken?: string }> {
  const userId = await getUserIdFromSession();
  if (userId) {
    return { cartId: userId };
  }

  const cookieStore = await cookies();
  let guestCartId = cookieStore.get("guest_cart_id")?.value;
  let guestToken = cookieStore.get("guest_cart_token")?.value;

  if (!guestCartId || !guestToken) {
    guestCartId = crypto.randomUUID();
    guestToken = crypto.randomBytes(32).toString("hex");

    // Set HttpOnly secure cookies for guest identification (expires in 30 days)
    cookieStore.set("guest_cart_id", guestCartId, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    cookieStore.set("guest_cart_token", guestToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return { cartId: guestCartId, plainGuestToken: guestToken };
}

// ─── Actions ────────────────────────────────────────────────────────────────

export async function getCartAction(): Promise<{ success: boolean; cart?: Cart; error?: string }> {
  try {
    const { cartId, plainGuestToken } = await getOrCreateCartSession();
    const userId = await getUserIdFromSession();

    const cart = await CartService.getOrCreateCart(cartId, plainGuestToken, userId || undefined);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("getCartAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load cart",
    };
  }
}

export async function addToCartAction(
  productId: string,
  sku: string,
  quantity: number,
  attributes: Record<string, string>
) {
  try {
    const { cartId, plainGuestToken } = await getOrCreateCartSession();

    // Fetch product to resolve snapshot details
    const product = await CatalogService.getProduct(productId);
    if (!product) {
      throw new NotFoundError(`Product not found: ${productId}`);
    }

    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) {
      throw new NotFoundError(`Product Variant SKU not found: ${sku}`);
    }

    // Explicit unit price precedence mapping
    const resolvedPrice =
      variant.price > 0 ? variant.price : product.discountPrice || product.basePrice;

    // Fetch brand name if brandId exists
    let brandName = "";
    if (product.brandId) {
      const brand = await CatalogService.getBrand(product.brandId);
      brandName = brand?.name || "";
    }

    const cartItem: CartItem = {
      productId,
      sku,
      quantity,
      price: resolvedPrice,
      productSnapshot: {
        title: product.title,
        mainImage: product.mainImage,
        variantAttributes: attributes,
        priceAtAdd: resolvedPrice,
        currency: product.currency || "USD",
        brandName,
      },
    };

    const cart = await CartService.addToCart(cartId, plainGuestToken, cartItem);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("addToCartAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add to cart",
    };
  }
}

export async function updateQuantityAction(sku: string, quantity: number) {
  try {
    const { cartId, plainGuestToken } = await getOrCreateCartSession();
    const cart = await CartService.updateQuantity(cartId, plainGuestToken, sku, quantity);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("updateQuantityAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update quantity",
    };
  }
}

export async function removeFromCartAction(sku: string) {
  try {
    const { cartId, plainGuestToken } = await getOrCreateCartSession();
    const cart = await CartService.removeFromCart(cartId, plainGuestToken, sku);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("removeFromCartAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove item",
    };
  }
}

export async function clearCartAction() {
  try {
    const { cartId, plainGuestToken } = await getOrCreateCartSession();
    const cart = await CartService.clearCart(cartId, plainGuestToken);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("clearCartAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cart",
    };
  }
}

export async function applyCouponAction(code: string) {
  try {
    const { cartId, plainGuestToken } = await getOrCreateCartSession();
    const cart = await CartService.applyCoupon(cartId, plainGuestToken, code);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("applyCouponAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply coupon",
    };
  }
}

export async function mergeCartsAction() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      throw new Error("Must be logged in to merge carts.");
    }

    const cookieStore = await cookies();
    const guestCartId = cookieStore.get("guest_cart_id")?.value;
    const guestToken = cookieStore.get("guest_cart_token")?.value;

    if (guestCartId && guestToken) {
      const cart = await CartService.mergeCarts(guestCartId, guestToken, userId);

      // Clear guest cookies
      cookieStore.delete("guest_cart_id");
      cookieStore.delete("guest_cart_token");

      return { success: true, cart };
    }

    // If no guest cart, just fetch the user's cart
    const cart = await CartService.getOrCreateCart(userId, undefined, userId);
    return { success: true, cart };
  } catch (error: unknown) {
    console.error("mergeCartsAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge carts",
    };
  }
}
