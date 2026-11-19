import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

type Params = Promise<{ callbackUrl?: string }>;

export default function LoginPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-linear-to-br from-pink-100 via-background to-amber-100 p-4">
      <Suspense fallback={null}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the URL parameters inside Suspense (required by cacheComponents).
async function LoginFormWithParams({ searchParams }: { searchParams: Params }) {
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={callbackUrl ?? "/order"} />;
}