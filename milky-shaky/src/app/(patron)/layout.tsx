import { Suspense, type ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";

export default function PatronLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b" />}>
        <Navbar />
      </Suspense>
      {children}
    </>
  );
}