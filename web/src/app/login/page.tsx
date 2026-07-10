import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Container } from "@/components/layout/layout-primitives";

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <Container className="flex justify-center">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </Container>
    </div>
  );
}
