import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/rbac";

type Params = Promise<{ next?: string }>;

export default function AfterLoginPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={null}>
      <DecideDestination searchParams={searchParams} />
    </Suspense>
  );
}

// Runs on the server after sign-in, with a fresh session read, and sends the user to the right place.
async function DecideDestination({ searchParams }: { searchParams: Params }): Promise<never> {
  await connection();
  const user = await requireUser();
  const { next } = await searchParams;

  const requested = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const asksForAdmin = requested.startsWith("/admin");

  if (user.role === "MANAGER") {
    redirect(requested && asksForAdmin ? requested : "/admin");
  }
  redirect(requested && !asksForAdmin ? requested : "/order");
}