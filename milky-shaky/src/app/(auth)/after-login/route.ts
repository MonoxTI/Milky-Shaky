import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Decides where a user goes after signing in. This runs as a plain server response,
// before any page is sent, so the redirect can't get lost.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response(null, { status: 303, headers: { Location: "/login" } });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });
  if (!user?.isActive) {
    return new Response(null, { status: 303, headers: { Location: "/login?reason=inactive" } });
  }

  const next = new URL(request.url).searchParams.get("next") ?? "";
  const requested = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const asksForAdmin = requested.startsWith("/admin");

  let destination: string;
  if (user.role === "MANAGER") {
    destination = requested && asksForAdmin ? requested : "/admin";
  } else {
    destination = requested && !asksForAdmin ? requested : "/order";
  }

  // A relative Location header is resolved against the address the browser is already on,
  // so it works on Vercel and locally without needing the site address.
  return new Response(null, { status: 303, headers: { Location: destination } });
}