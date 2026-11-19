import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function ReportsIndexPage() {
  await connection();
  redirect("/admin/reports/orders");
}