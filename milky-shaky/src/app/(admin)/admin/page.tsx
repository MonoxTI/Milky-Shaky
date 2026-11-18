import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireRole } from "@/lib/rbac";

export default function AdminPage() {
  return (
    <main className="space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Management</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

// Reads the session inside Suspense (required by cacheComponents).
async function AdminContent() {
  const user = await requireRole("MANAGER");
  return (
    <>
      <p className="text-muted-foreground">
        Signed in as {user.name} ({user.role}).
      </p>
      <SignOutButton />
    </>
  );
}