import { ProductForm } from "@/components/admin/product-form";
import { Container } from "@/components/layout/layout-primitives";

export default function AdminProductCreatePage() {
  return (
    <div className="flex-1 py-10 bg-background text-foreground">
      <Container>
        <ProductForm />
      </Container>
    </div>
  );
}
