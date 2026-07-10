import { ProductRepository, CategoryRepository, BrandRepository } from "../repository/concrete";
import { Product, Category, Brand, ProductMapper } from "@zell/shared";
import { QueryBuilder, QueryOptions } from "../query/query-builder";
import { getDb } from "../config/firebase";

export class CatalogService {
  private static productRepo = new ProductRepository();
  private static categoryRepo = new CategoryRepository();
  private static brandRepo = new BrandRepository();

  // ─── Product CRUD ──────────────────────────────────────────────────────────

  public static async createProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.productRepo.create(id, product);
  }

  public static async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    return this.productRepo.update(id, product);
  }

  public static async deleteProduct(id: string): Promise<void> {
    return this.productRepo.delete(id);
  }

  public static async getProduct(id: string): Promise<Product | null> {
    return this.productRepo.findById(id);
  }

  // ─── Category CRUD ─────────────────────────────────────────────────────────

  public static async createCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.categoryRepo.create(id, category);
  }

  public static async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    return this.categoryRepo.update(id, category);
  }

  public static async deleteCategory(id: string): Promise<void> {
    return this.categoryRepo.delete(id);
  }

  public static async getCategory(id: string): Promise<Category | null> {
    return this.categoryRepo.findById(id);
  }

  // ─── Brand CRUD ────────────────────────────────────────────────────────────

  public static async createBrand(id: string, brand: Partial<Brand>): Promise<Brand> {
    return this.brandRepo.create(id, brand);
  }

  public static async getBrand(id: string): Promise<Brand | null> {
    return this.brandRepo.findById(id);
  }

  // ─── Category Tree ─────────────────────────────────────────────────────────

  /**
   * Build a nested category tree from flat Firestore records.
   * Uses parentId field for hierarchy. O(n) via Map lookup.
   */
  public static async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const categories = await this.categoryRepo.query();
    const categoryMap = new Map<string, CategoryTreeNode>();

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: CategoryTreeNode[] = [];
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

  // ─── Query Products ────────────────────────────────────────────────────────

  /**
   * Query products using QueryBuilder options (filters, ordering, pagination).
   * Uses ProductMapper directly — no internal accessor hacks.
   */
  public static async queryProducts(options: QueryOptions): Promise<Product[]> {
    const db = getDb();
    const query = QueryBuilder.build(db.collection("products"), options);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data: Record<string, unknown> = { id: doc.id, ...doc.data() };
      return ProductMapper.toDomain(data);
    });
  }
}

// ─── Supporting Types ───────────────────────────────────────────────────────

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}
