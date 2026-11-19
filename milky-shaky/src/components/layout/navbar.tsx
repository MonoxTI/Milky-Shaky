import Link from "next/link";
import { connection } from "next/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Brand } from "@/components/layout/brand";
import { auth } from "@/lib/auth";

const linkClass =
  "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-secondary-foreground";

// Reads the session, so it's rendered at request time (required by cacheComponents).
export async function Navbar() {
  await connection();
  const session = await auth();
  const user = session?.user;
  const isManager = user?.role === "MANAGER";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <Brand />
          <div className="flex items-center gap-1">
            <Link href="/order" className={linkClass}>
              Order
            </Link>
            {user && (
              <Link href="/orders" className={linkClass}>
                My orders
              </Link>
            )}
            {isManager && (
              <Link href="/admin" className={linkClass}>
                Management
              </Link>
            )}
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground">{isManager ? "Manager" : "Client"}</p>
            </div>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}