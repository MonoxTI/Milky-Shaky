import { redirect } from "next/navigation";

/** Sends the user back to a page with a one-line message. Server actions use this when they finish. */
export function flashTo(path: string, kind: "notice" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}