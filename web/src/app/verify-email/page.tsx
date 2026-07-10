import { EmailVerification } from "@/components/auth/email-verification";
import { Container } from "@/components/layout/layout-primitives";

export default function VerifyEmailPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <Container className="flex justify-center">
        <EmailVerification />
      </Container>
    </div>
  );
}
