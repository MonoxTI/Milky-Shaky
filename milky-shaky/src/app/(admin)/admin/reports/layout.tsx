import { ReportTabs } from "@/components/reports/report-tabs";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Management</p>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        </div>
        <ReportTabs />
      </div>
      {children}
    </main>
  );
}