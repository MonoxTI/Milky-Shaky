import { Suspense, type ReactNode } from "react";
import { SectionTabs } from "@/components/admin/section-tabs";
import { Navbar } from "@/components/layout/navbar";

const ADMIN_TABS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/lookups", label: "Lookups" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b" />}>
        <Navbar />
      </Suspense>
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Suspense fallback={<div className="h-10 border-b" />}>
          <SectionTabs items={ADMIN_TABS} />
        </Suspense>
      </div>
      {children}
    </>
  );
}