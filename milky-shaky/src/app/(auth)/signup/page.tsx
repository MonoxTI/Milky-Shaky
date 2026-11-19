import { SignupForm } from "@/components/auth/signup-form";
import { Brand } from "@/components/layout/brand";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-linear-to-br from-pink-100 via-background to-amber-100 p-4">
      <Brand />
      <SignupForm />
    </main>
  );
}