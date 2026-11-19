"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/reports/orders", label: "Orders" },
  { href: "/admin/reports/trends", label: "Trends" },
  { href: "/admin/reports/audit", label: "Audit trail" },
];

export function ReportTabs() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}