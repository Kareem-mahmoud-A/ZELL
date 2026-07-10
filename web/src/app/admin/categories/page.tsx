import { CatalogService } from "@zell/database";
import { Container } from "@/components/layout/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categoryTree = await CatalogService.getCategoryTree();

  return (
    <div className="flex-1 py-10 bg-background text-foreground">
      <Container className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Categories Hierarchy Tree</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active Flat Categories Tree</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {categoryTree.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories defined yet.</p>
            ) : (
              categoryTree.map((cat) => (
                <div
                  key={cat.id}
                  className="border-l-2 border-primary/20 pl-4 py-1 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center bg-secondary/30 p-2 rounded">
                    <span className="font-semibold">
                      {cat.name} ({cat.slug})
                    </span>
                  </div>
                  {cat.children &&
                    cat.children.map((sub: { id: string; name: string; slug: string }) => (
                      <div
                        key={sub.id}
                        className="pl-6 border-l border-border py-1 flex justify-between items-center text-sm"
                      >
                        <span>
                          {sub.name} ({sub.slug})
                        </span>
                      </div>
                    ))}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
