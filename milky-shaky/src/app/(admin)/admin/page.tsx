import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireRole } from "@/lib/rbac";

export default async function AdminPage() {
  const user = await requireRole("MANAGER");
  return (
    <main className="space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Management</h1>
      <p className="text-muted-foreground">Signed in as {user.name} ({user.role}).</p>
      <SignOutButton />
    </main>
  );
}