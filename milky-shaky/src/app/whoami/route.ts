import { auth } from "@/lib/auth";

// TEMPORARY debugging route. Shows only the signed-in user's id, name and role.
// Delete this file once login is working.
export async function GET() {
  const session = await auth();
  return Response.json({
    signedIn: Boolean(session?.user),
    user: session?.user ?? null,
  });
}