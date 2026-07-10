import { InventoryRepository } from "@zell/database";
import { Container } from "@/components/layout/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const inventoryRepo = new InventoryRepository();
  const stockItems = await inventoryRepo.query();

  return (
    <div className="flex-1 py-10 bg-background text-foreground">
      <Container className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Audited Stock Inventory</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              SKU Stock Statuses & Movements Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-secondary-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product ID</th>
                  <th className="p-4">Available Quantity</th>
                  <th className="p-4">Reserved Quantity</th>
                  <th className="p-4">Reorder Point</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No inventory tracks established.
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => (
                    <tr key={item.sku} className="hover:bg-muted/50">
                      <td className="p-4 font-mono font-semibold">{item.sku}</td>
                      <td className="p-4">{item.productId}</td>
                      <td className="p-4">{item.quantity}</td>
                      <td className="p-4 text-muted-foreground">{item.reservedQuantity}</td>
                      <td className="p-4">{item.reorderPoint}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            item.status === "OUT_OF_STOCK"
                              ? "destructive"
                              : item.status === "LOW_STOCK"
                                ? "outline"
                                : "default"
                          }
                        >
                          {item.status}
                        </Badge>
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
