import { notFound } from "next/navigation";
import { CatalogService } from "@zell/database";
import { Container } from "@/components/layout/layout-primitives";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch product by slug
  const products = await CatalogService.queryProducts({
    where: [{ field: "slug", operator: "==", value: slug }],
    limit: 1,
  });

  const product = products[0];
  if (!product) {
    notFound();
  }

  return (
    <div className="flex-1 py-12 bg-background text-foreground">
      <Container className="flex flex-col gap-10">
        <VariantSelector product={product} />

        {/* Product Descriptions and Metadata */}
        <div className="border-t border-border pt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-4">
            <h2 className="text-xl font-bold">About the Product</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
          <div className="md:col-span-1 flex flex-col gap-6 bg-card p-6 rounded-lg border border-border">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category Tags
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            {product.collections.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Collections
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.collections.map((col) => (
                    <Badge key={col} variant="outline" className="text-primary border-primary/30">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
