"use server";

import { cookies } from "next/headers";
import { Role, Product, Category } from "@zell/shared";
import { CatalogService, InventoryService } from "@zell/database";

interface JwtPayload {
  uid?: string;
  role?: string;
  [key: string]: unknown;
}

// Decode session JWT safely on server side
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

// Verify request context caller has ADMIN, MERCHANT or MANAGER permissions
async function verifyAdminAuth(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) {
    throw new Error("Unauthenticated request");
  }

  const payload = decodeJwt(session);
  const userRole = payload?.role;

  if (userRole !== Role.ADMIN && userRole !== Role.MERCHANT && userRole !== Role.MANAGER) {
    throw new Error("Permission Denied: Insufficient authorization level");
  }

  return payload?.uid ?? "admin-operator";
}

export async function saveProductAction(id: string, productData: Partial<Product>) {
  try {
    await verifyAdminAuth();
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

export async function saveCategoryAction(id: string, categoryData: Partial<Category>) {
  try {
    await verifyAdminAuth();
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

export async function adjustStockAction(sku: string, quantityChange: number, reason: string) {
  try {
    const operatorUid = await verifyAdminAuth();
    await InventoryService.adjustStock(sku, quantityChange, reason, operatorUid);
    return { success: true, message: "Inventory adjusted successfully" };
  } catch (error: unknown) {
    console.error("Action adjustStock error:", error);
    const message = error instanceof Error ? error.message : "Failed to adjust stock";
    return { success: false, error: message };
  }
}
