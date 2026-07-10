import { RegisterForm } from "@/components/auth/register-form";
import { Container } from "@/components/layout/layout-primitives";

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <Container className="flex justify-center">
        <RegisterForm />
      </Container>
    </div>
  );
}
