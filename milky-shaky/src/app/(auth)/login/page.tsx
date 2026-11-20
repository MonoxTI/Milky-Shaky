import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/layout/brand";

type Params = Promise<{ callbackUrl?: string; reason?: string }>;

export default function LoginPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-linear-to-br from-pink-100 via-background to-amber-100 p-4">
      <Brand />
      <Suspense fallback={null}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the URL parameters inside Suspense (required by cacheComponents).
// No callbackUrl means "send me where my role belongs" (managers to /admin, clients to /order).
async function LoginFormWithParams({ searchParams }: { searchParams: Params }) {
  const { callbackUrl, reason } = await searchParams;
  return (
    <div className="w-full max-w-sm space-y-4">
      {reason === "inactive" && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This account has been deactivated. Please contact the Milky Shaky team.
        </p>
      )}
      <LoginForm callbackUrl={callbackUrl ?? ""} />
    </div>
  );
}