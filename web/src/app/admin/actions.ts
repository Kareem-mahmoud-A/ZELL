"use server";

import { cookies } from "next/headers";
import {
  Role,
  Permission,
  SecurityPolicy,
  Product,
  Category,
  UnauthorizedError,
  ForbiddenError,
} from "@zell/shared";
import { CatalogService, InventoryService } from "@zell/database";

interface JwtPayload {
  uid?: string;
  role?: string;
  [key: string]: unknown;
}

// Decode session JWT payload — the token itself was verified at /api/auth/session creation time
function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8")) as JwtPayload;
  } catch {
    return null;
  }
}

/** Extract and verify the authenticated user from session cookie. */
async function getAuthenticatedUser(): Promise<{ uid: string; role: Role }> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    throw new UnauthorizedError("No active session. Please log in.");
  }

  const payload = decodeJwt(session);
  if (!payload?.role || !payload?.uid) {
    throw new UnauthorizedError("Invalid session token.");
  }

  // Validate role is a recognised enum value
  const role = payload.role as Role;
  if (!Object.values(Role).includes(role)) {
    throw new ForbiddenError(`Unrecognised role: ${String(payload.role)}`);
  }

  return { uid: payload.uid as string, role };
}

/** Require a specific permission — throws ForbiddenError if not satisfied. */
function requirePermission(role: Role, permission: Permission): void {
  if (!SecurityPolicy.hasPermission(role, permission)) {
    throw new ForbiddenError(`Role '${role}' does not have permission '${permission}'.`);
  }
}

// ─── Product Actions ────────────────────────────────────────────────────────

export async function saveProductAction(id: string, productData: Partial<Product>) {
  try {
    const { role } = await getAuthenticatedUser();
    requirePermission(role, Permission.MANAGE_PRODUCTS);

    if (id) {
      await CatalogService.updateProduct(id, productData);
      return { success: true, message: "Product updated successfully" };
    } else {
      const generatedId = Math.random().toString(36).substring(7);
      const newProduct = await CatalogService.createProduct(generatedId, productData);
      return { success: true, product: newProduct, message: "Product created successfully" };
    }
  } catch (error: unknown) {
    console.error("Action saveProduct error:", error);
    const message = error instanceof Error ? error.message : "Failed to save product";
    return { success: false, error: message };
  }
}

// ─── Category Actions ───────────────────────────────────────────────────────

export async function saveCategoryAction(id: string, categoryData: Partial<Category>) {
  try {
    const { role } = await getAuthenticatedUser();
    requirePermission(role, Permission.MANAGE_PRODUCTS);

    if (id) {
      await CatalogService.updateCategory(id, categoryData);
      return { success: true, message: "Category updated successfully" };
    } else {
      const generatedId = Math.random().toString(36).substring(7);
      const newCategory = await CatalogService.createCategory(generatedId, categoryData);
      return { success: true, category: newCategory, message: "Category created successfully" };
    }
  } catch (error: unknown) {
    console.error("Action saveCategory error:", error);
    const message = error instanceof Error ? error.message : "Failed to save category";
    return { success: false, error: message };
  }
}

// ─── Inventory Actions ──────────────────────────────────────────────────────

export async function adjustStockAction(sku: string, quantityChange: number, reason: string) {
  try {
    const { uid, role } = await getAuthenticatedUser();
    requirePermission(role, Permission.MANAGE_INVENTORY);

    await InventoryService.adjustStock(sku, quantityChange, reason, uid);
    return { success: true, message: "Inventory adjusted successfully" };
  } catch (error: unknown) {
    console.error("Action adjustStock error:", error);
    const message = error instanceof Error ? error.message : "Failed to adjust stock";
    return { success: false, error: message };
  }
}
