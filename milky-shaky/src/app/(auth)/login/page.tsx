import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

type Params = Promise<{ callbackUrl?: string }>;

export default function LoginPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
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