import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

// Suspense required: AuthForm reads useSearchParams() to honor ?redirect_url,
// and Next 15+ static prerendering bails out otherwise.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm defaultMode="login" />
    </Suspense>
  );
}
