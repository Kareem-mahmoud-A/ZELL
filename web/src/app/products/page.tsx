import { CatalogService } from "@zell/database";
import { BrandRepository, QueryOptions } from "@zell/database";
import { Container } from "@/components/layout/layout-primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SortSelector } from "@/components/catalog/sort-selector";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeCategory = params.category;
  const activeBrand = params.brand;
  const activeSort = params.sort || "newest";
  const activeSearch = params.search || "";

  // 1. Fetch categories, brands and products from database (Server-side)
  const categoryTree = await CatalogService.getCategoryTree();
  const brandRepo = new BrandRepository();
  const brands = await brandRepo.query();

  // 2. Build Query Options for Catalog Service
  const whereFilters: NonNullable<QueryOptions["where"]> = [];
  if (activeCategory) {
    whereFilters.push({ field: "categories", operator: "array-contains", value: activeCategory });
  }
  if (activeBrand) {
    whereFilters.push({ field: "brandId", operator: "==", value: activeBrand });
  }
  if (activeSearch) {
    // Simple prefix search matching
    whereFilters.push({ field: "title", operator: ">=", value: activeSearch });
    whereFilters.push({ field: "title", operator: "<=", value: activeSearch + "\uf8ff" });
  }

  let orderBy = "createdAt";
  let orderDirection: "asc" | "desc" = "desc";
  if (activeSort === "price_asc") {
    orderBy = "basePrice";
    orderDirection = "asc";
  } else if (activeSort === "price_desc") {
    orderBy = "basePrice";
    orderDirection = "desc";
  }

  const products = await CatalogService.queryProducts({
    where: whereFilters,
    orderBy,
    orderDirection,
    limit: 20,
  });

  return (
    <div className="flex-1 py-10 bg-background text-foreground">
      <Container className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Link
                href="/products"
                className={`hover:underline ${!activeCategory ? "font-bold text-primary" : ""}`}
              >
                All Categories
              </Link>
              {categoryTree.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-1 pl-2">
                  <Link
                    href={`/products?category=${cat.id}`}
                    className={`hover:underline ${activeCategory === cat.id ? "font-bold text-primary" : ""}`}
                  >
                    {cat.name}
                  </Link>
                  {cat.children &&
                    cat.children.map((sub: { id: string; name: string }) => (
                      <Link
                        key={sub.id}
                        href={`/products?category=${sub.id}`}
                        className={`pl-3 text-xs hover:underline ${activeCategory === sub.id ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Brands</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Link
                href="/products"
                className={`hover:underline ${!activeBrand ? "font-bold text-primary" : ""}`}
              >
                All Brands
              </Link>
              {brands.map((br) => (
                <Link
                  key={br.id}
                  href={`/products?brand=${br.id}`}
                  className={`hover:underline ${activeBrand === br.id ? "font-bold text-primary" : ""}`}
                >
                  {br.name}
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Products Grid */}
        <section className="md:col-span-3 flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border">
            <span className="text-sm text-muted-foreground">{products.length} products found</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Sort By</label>
              <SortSelector defaultValue={activeSort} />
            </div>
          </div>

          {/* Grid list */}
          {products.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-lg border border-border">
              <p className="text-lg font-medium text-muted-foreground">No products found</p>
              <Link href="/products" className="mt-4 inline-block text-primary hover:underline">
                Clear all filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => {
                const hasDiscount = prod.discountPrice && prod.discountPrice < prod.basePrice;
                return (
                  <Card
                    key={prod.id}
                    className="overflow-hidden flex flex-col h-full hover:shadow-md"
                  >
                    <div className="relative h-60 w-full bg-secondary">
                      <Image
                        src={prod.mainImage || "/placeholder.jpg"}
                        alt={prod.title}
                        fill
                        className="object-cover"
                      />
                      {prod.isFeatured && (
                        <Badge className="absolute top-2 left-2" variant="default">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col gap-2 justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                          {prod.status}
                        </span>
                        <h3 className="text-base font-semibold leading-tight text-foreground hover:underline">
                          <Link href={`/products/${prod.slug}`}>{prod.title}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {prod.shortDescription}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        {hasDiscount ? (
                          <>
                            <span className="text-base font-bold text-primary">
                              ${(prod.discountPrice! / 100).toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ${(prod.basePrice / 100).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-foreground">
                            ${(prod.basePrice / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
}
