"use server";

import { cookies } from "next/headers";
import { Role, Wishlist, WishlistItem, Product, UnauthorizedError } from "@zell/shared";
import { WishlistService, CatalogService } from "@zell/database";

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

/** Enforce authentication and retrieve user ID. */
async function requireUserId(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    throw new UnauthorizedError("Authentication required. Please log in.");
  }
  const payload = decodeJwt(session);
  if (!payload?.uid) {
    throw new UnauthorizedError("Invalid authentication session.");
  }
  return payload.uid;
}

// ─── Actions ────────────────────────────────────────────────────────────────

export async function getWishlistAction(): Promise<{
  success: boolean;
  wishlist?: Wishlist;
  products?: Product[];
  error?: string;
}> {
  try {
    const userId = await requireUserId();
    const wishlist = await WishlistService.getOrCreateWishlist(userId);

    // Fetch product snapshot details for rendering
    const productIds = Array.from(new Set(wishlist.items.map((i) => i.productId)));
    const products: Product[] = [];
    for (const id of productIds) {
      const p = await CatalogService.getProduct(id);
      if (p) products.push(p);
    }

    return { success: true, wishlist, products };
  } catch (error: unknown) {
    console.error("getWishlistAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load wishlist",
    };
  }
}

export async function addToWishlistAction(
  productId: string,
  sku: string,
  attributes?: Record<string, string>
) {
  try {
    const userId = await requireUserId();
    const item: WishlistItem = {
      productId,
      sku,
      addedAt: new Date(),
      attributes,
    };
    const wishlist = await WishlistService.addToWishlist(userId, item);
    return { success: true, wishlist };
  } catch (error: unknown) {
    console.error("addToWishlistAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add to wishlist",
    };
  }
}

export async function removeFromWishlistAction(sku: string) {
  try {
    const userId = await requireUserId();
    const wishlist = await WishlistService.removeFromWishlist(userId, sku);
    return { success: true, wishlist };
  } catch (error: unknown) {
    console.error("removeFromWishlistAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove item",
    };
  }
}

export async function moveToCartAction(sku: string) {
  try {
    const userId = await requireUserId();
    await WishlistService.moveToCart(userId, sku, userId);
    return { success: true };
  } catch (error: unknown) {
    console.error("moveToCartAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move item to cart",
    };
  }
}
