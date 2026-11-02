"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuditLogItem } from "@/lib/audit/logger";
import {
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  ChevronDown,
  ChevronRight,
  Globe,
  Clock,
  User,
} from "lucide-react";

const ACTION_COLORS: Record<string, { label: string; badgeClass: string }> = {
  "itinerary.create": {
    label: "Proposal Created",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  "itinerary.update": {
    label: "Proposal Updated",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  "itinerary.soft_delete": {
    label: "Proposal Soft-Deleted",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
  },
  "itinerary.restore": {
    label: "Proposal Restored",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  "itinerary.reassign": {
    label: "Proposal Reassigned",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  "pdf.generate": {
    label: "PDF Export Generated",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  "user.invite": {
    label: "Staff Invited",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
  },
  "user.role_change": {
    label: "Staff Role Changed",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  "user.ban": {
    label: "Staff Suspended",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
  "user.unban": {
    label: "Staff Reactivated",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  "settings.update": {
    label: "Commercial Settings Updated",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = actionFilter !== "all" ? `/api/admin/audit?action=${actionFilter}` : "/api/admin/audit";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      log.action.toLowerCase().includes(q) ||
      log.targetId.toLowerCase().includes(q) ||
      (log.actorId && log.actorId.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Append-Only Audit Ledger
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete, immutable audit trail of proposal modifications, pricing changes, staff access, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, actor, or metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-3 py-1 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium"
          >
            <option value="all">All Sensitive Actions</option>
            <option value="itinerary.create">itinerary.create</option>
            <option value="itinerary.update">itinerary.update</option>
            <option value="itinerary.soft_delete">itinerary.soft_delete</option>
            <option value="itinerary.restore">itinerary.restore</option>
            <option value="itinerary.reassign">itinerary.reassign</option>
            <option value="pdf.generate">pdf.generate</option>
            <option value="user.invite">user.invite</option>
            <option value="user.role_change">user.role_change</option>
            <option value="user.ban">user.ban</option>
            <option value="settings.update">settings.update</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[190px]">Event Type</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Actor / Initiator</TableHead>
              <TableHead>Client IP</TableHead>
              <TableHead className="w-[80px] text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Querying immutable audit log...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No audit log entries match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const conf = ACTION_COLORS[log.action] || {
                  label: log.action,
                  badgeClass: "bg-muted text-muted-foreground border-border",
                };
                const isExpanded = expandedId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className={`hover:bg-muted/30 cursor-pointer ${
                        isExpanded ? "bg-muted/20" : ""
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>
                            {new Date(log.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${conf.badgeClass}`}
                        >
                          {conf.label}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground">
                            {log.targetType}:{" "}
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {log.targetId}
                            </span>
                          </div>
                          {log.metadata && typeof (log.metadata as any).title === "string" && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                              {(log.metadata as any).title}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                          <User className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {log.actorId ? log.actorId.replace("usr_", "") : "System"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>{log.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="size-7 p-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="p-4">
                          <div className="bg-slate-950 text-slate-100 rounded-xl p-3 font-mono text-xs overflow-x-auto shadow-inner">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                              <span>Log ID: {log.id}</span>
                              <span>Target: {log.targetType} / {log.targetId}</span>
                            </div>
                            <pre className="text-[11px] text-emerald-400">
                              {JSON.stringify(log.metadata || {}, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
