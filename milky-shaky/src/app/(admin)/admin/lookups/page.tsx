import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function LookupsIndexPage() {
  await connection();
  redirect("/admin/lookups/flavour");
}