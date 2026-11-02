"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sliders, Users, Trash2, ShieldAlert, ArrowLeft } from "lucide-react";

const NAV_TABS = [
  {
    name: "Commercial Settings",
    href: "/admin/settings",
    icon: Sliders,
    description: "Markups, Rounding, TCS & Tax Rules",
  },
  {
    name: "Staff Directory",
    href: "/admin/users",
    icon: Users,
    description: "Sales Agents, Roles & Invitations",
  },
  {
    name: "Trash & Restore",
    href: "/admin/trash",
    icon: Trash2,
    description: "Soft-Deleted Proposals Ledger",
  },
  {
    name: "Audit Ledger",
    href: "/admin/audit",
    icon: ShieldAlert,
    description: "Immutable Security & Activity Logs",
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Breadcrumb */}
        <div className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              <Link
                href="/"
                className="hover:text-foreground transition flex items-center gap-1 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                Workbench
              </Link>
              <span>/</span>
              <span className="text-foreground">Operations Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              Agency Operations Cockpit
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Admin Privilege
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Staff management, proposal governance, audit trail and commercial pricing controls.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Workbench
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none pb-px" aria-label="Admin Navigation Tabs">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary font-bold bg-primary/5 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
