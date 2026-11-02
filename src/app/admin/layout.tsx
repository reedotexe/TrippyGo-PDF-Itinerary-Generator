import React from "react";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = {
  title: "Admin Operations Cockpit | TrippyGo",
  description: "Executive controls, staff directory, proposal governance, and audit ledger.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-screen bg-muted/20 text-foreground flex flex-col font-sans">
      <AdminNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
