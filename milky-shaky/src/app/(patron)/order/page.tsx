import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireUser } from "@/lib/rbac";

export default async function OrderPage() {
  const user = await requireUser();
  return (
    <main className="space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="text-muted-foreground">Ordering screens arrive in Phase 6.</p>
      <SignOutButton />
    </main>
  );
}
