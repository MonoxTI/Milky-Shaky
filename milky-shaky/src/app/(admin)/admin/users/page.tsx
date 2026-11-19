import { connection } from "next/server";
import { Suspense } from "react";
import { ActiveBadge, Field, inputClass, panelClass, primaryButtonClass, secondaryButtonClass } from "@/components/admin/ui";
import { FlashMessage } from "@/components/layout/flash-message";
import { createUserAction, setUserActiveAction } from "@/features/users/actions";
import { listUsers } from "@/features/users/admin";
import { requireRole } from "@/lib/rbac";

type Search = Promise<{ notice?: string; error?: string }>;

export default function UsersPage({ searchParams }: { searchParams: Search }) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Management</p>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Create manager and client accounts. Deactivated accounts can't log in or place orders. Share temporary
          passwords securely and ask people to change theirs.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <UsersContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// Reads the session and live data, so it sits inside Suspense (required by cacheComponents).
async function UsersContent({ searchParams }: { searchParams: Search }) {
  await connection();
  const current = await requireRole("MANAGER");

  const flash = await searchParams;
  const users = await listUsers();

  return (
    <>
      <FlashMessage notice={flash.notice} error={flash.error} />

      <form action={createUserAction} className={`${panelClass} grid gap-4 lg:grid-cols-6 lg:items-end`}>
        <div className="lg:col-span-1">
          <Field label="Full name">
            <input name="firstName" required maxLength={60} className={inputClass} />
          </Field>
        </div>
        <div className="lg:col-span-1">
          <Field label="Email">
            <input name="email" type="email" required className={inputClass} />
          </Field>
        </div>
        <div className="lg:col-span-1">
          <Field label="Mobile">
            <input name="mobile" type="tel" placeholder="082 123 4567" required className={inputClass} />
          </Field>
        </div>
        <div className="lg:col-span-1">
          <Field label="Temporary password">
            <input name="password" type="password" minLength={8} required className={inputClass} />
          </Field>
        </div>
        <div className="lg:col-span-1">
          <Field label="Role">
            <select name="role" defaultValue="CLIENT" className={inputClass}>
              <option value="CLIENT">Client</option>
              <option value="MANAGER">Manager</option>
            </select>
          </Field>
        </div>
        <button type="submit" className={primaryButtonClass}>
          Create account
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Mobile</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.firstName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.mobile}</td>
                <td className="px-4 py-3">{u.role === "MANAGER" ? "Manager" : "Client"}</td>
                <td className="px-4 py-3">
                  <ActiveBadge active={u.isActive} activeText="Active" inactiveText="Deactivated" />
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id === current.id ? (
                    <span className="text-xs text-muted-foreground">You</span>
                  ) : (
                    <form action={setUserActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={u.isActive ? "false" : "true"} />
                      <button type="submit" className={secondaryButtonClass}>
                        {u.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}