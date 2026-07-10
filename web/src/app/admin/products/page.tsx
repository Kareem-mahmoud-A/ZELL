import { CatalogService } from "@zell/database";
import { Container } from "@/components/layout/layout-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Fetch all products (Server Component)
  const products = await CatalogService.queryProducts({ limit: 100 });

  return (
    <div className="flex-1 py-10 bg-background text-foreground">
      <Container className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Admin Products Management</h1>
          <Link href="/admin/products/create">
            <Button size="sm">Add Product</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">All Catalog Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-secondary-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No products created yet.
                    </td>
                  </tr>
                ) : (
                  products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-muted/50">
                      <td className="p-4 font-semibold">{prod.title}</td>
                      <td className="p-4 text-muted-foreground">{prod.slug}</td>
                      <td className="p-4">${(prod.basePrice / 100).toFixed(2)}</td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                          {prod.status}
                        </span>
                      </td>
                      <td className="p-4 text-primary font-medium hover:underline">
                        <Link href={`/admin/products/edit/${prod.id}`}>Edit</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
