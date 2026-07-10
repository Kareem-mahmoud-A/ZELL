import { describe, it, expect } from "vitest";
import { Role, SecurityPolicy, Permission } from "@zell/shared";
import { InventoryStatus } from "@zell/shared";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children: CategoryNode[];
}

// Local category tree builder simulation
function buildCategoryTree(categories: Omit<CategoryNode, "children">[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  const rootCategories: CategoryNode[] = [];
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (!node) return;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId)!.children.push(node);
    } else {
      rootCategories.push(node);
    }
  });

  return rootCategories;
}

// Local stock status evaluator simulation
function getInventoryStatus(
  quantity: number,
  reservedQuantity: number,
  lowStockThreshold: number
): InventoryStatus {
  const available = quantity - reservedQuantity;
  if (available <= 0) return InventoryStatus.OUT_OF_STOCK;
  if (available <= lowStockThreshold) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}

describe("E-commerce Pricing Calculations", () => {
  it("should calculate correct active pricing with overrides", () => {
    const productBasePrice = 10000;
    const variantOverridePrice = 12000;
    const variantNoOverridePrice = 0;

    const price1 = variantOverridePrice > 0 ? variantOverridePrice : productBasePrice;
    const price2 = variantNoOverridePrice > 0 ? variantNoOverridePrice : productBasePrice;

    expect(price1).toBe(12000);
    expect(price2).toBe(10000);
  });
});

describe("Categories Flat Hierarchy Parser", () => {
  it("should parse flat category records into nested child trees", () => {
    const flatCategories = [
      { id: "clothing", name: "Clothing", slug: "clothing" },
      { id: "tops", name: "Tops", slug: "tops", parentId: "clothing" },
      { id: "pants", name: "Pants", slug: "pants", parentId: "clothing" },
      { id: "electronics", name: "Electronics", slug: "electronics" },
    ];

    const tree = buildCategoryTree(flatCategories);
    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe("clothing");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe("tops");
    expect(tree[1].id).toBe("electronics");
  });
});

describe("Inventory Alarms & Stock Level Status", () => {
  it("should evaluate stock alerts based on available vs reserved stock", () => {
    expect(getInventoryStatus(10, 0, 3)).toBe(InventoryStatus.IN_STOCK);
    expect(getInventoryStatus(10, 8, 3)).toBe(InventoryStatus.LOW_STOCK);
    expect(getInventoryStatus(10, 10, 3)).toBe(InventoryStatus.OUT_OF_STOCK);
  });
});

describe("RBAC Catalog & Inventory Authorizations", () => {
  it("should restrict catalog modifications to Admin, Manager and Merchant roles", () => {
    expect(SecurityPolicy.hasPermission(Role.ADMIN, Permission.MANAGE_PRODUCTS)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.MANAGER, Permission.MANAGE_PRODUCTS)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.MERCHANT, Permission.MANAGE_PRODUCTS)).toBe(true);

    expect(SecurityPolicy.hasPermission(Role.CUSTOMER, Permission.MANAGE_PRODUCTS)).toBe(false);
    expect(SecurityPolicy.hasPermission(Role.GUEST, Permission.MANAGE_PRODUCTS)).toBe(false);
  });

  it("should permit viewing catalog for all roles", () => {
    expect(SecurityPolicy.hasPermission(Role.CUSTOMER, Permission.VIEW_CATALOG)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.GUEST, Permission.VIEW_CATALOG)).toBe(true);
    expect(SecurityPolicy.hasPermission(Role.SUPPORT, Permission.VIEW_CATALOG)).toBe(true);
  });
});
