import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm callbackUrl={callbackUrl ?? "/order"} />
    </main>
  );
}