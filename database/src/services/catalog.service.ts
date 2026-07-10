import { ProductRepository, CategoryRepository, BrandRepository } from "../repository/concrete";
import { Product, Category, Brand } from "@zell/shared";
import { QueryBuilder, QueryOptions } from "../query/query-builder";
import { getDb } from "../config/firebase";

export class CatalogService {
  private static productRepo = new ProductRepository();
  private static categoryRepo = new CategoryRepository();
  private static brandRepo = new BrandRepository();

  // Product CRUD
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

  // Category CRUD
  public static async createCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.categoryRepo.create(id, category);
  }

  public static async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    return this.categoryRepo.update(id, category);
  }

  // Brand CRUD
  public static async createBrand(id: string, brand: Partial<Brand>): Promise<Brand> {
    return this.brandRepo.create(id, brand);
  }

  // Category Tree Retrieval (Flat nodes parser)
  public static async getCategoryTree(): Promise<any[]> {
    const categories = await this.categoryRepo.query();
    const categoryMap = new Map<string, any>();

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const rootCategories: any[] = [];
    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(node);
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  }

  // Query products with pagination, sorting, filtering
  public static async queryProducts(options: QueryOptions): Promise<Product[]> {
    const db = getDb();
    const query = QueryBuilder.build(db.collection("products"), options);
    const snapshot = await query.get();
    const repo = new ProductRepository();
    const mapper = (repo as any).mapper;

    return snapshot.docs.map((doc) => {
      const data = { id: doc.id, ...doc.data() };
      return mapper ? mapper.toDomain(data) : data;
    });
  }
}
