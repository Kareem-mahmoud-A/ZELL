import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Container } from "@/components/layout/layout-primitives";

export default function ForgotPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <Container className="flex justify-center">
        <ForgotPasswordForm />
      </Container>
    </div>
  );
}
