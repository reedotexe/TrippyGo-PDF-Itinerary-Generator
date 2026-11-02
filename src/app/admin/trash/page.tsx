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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  User,
} from "lucide-react";

interface TrashProposal {
  id: string;
  title: string;
  guestName?: string;
  destinations: string[];
  daysCount: number;
  nightsCount: number;
  sellingPriceFormatted: string;
  ownerId?: string | null;
  ownerName?: string;
  deletedAt?: string | null;
  updatedAt: string;
}

export default function AdminTrashPage() {
  const [items, setItems] = useState<TrashProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTrash = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trash");
      const data = await res.json();
      if (Array.isArray(data.itineraries)) {
        setItems(data.itineraries);
      }
    } catch {
      setError("Failed to fetch trash ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string, title: string) => {
    setRestoringId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/itineraries/${id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore proposal");

      setSuccess(`Proposal '${title || "Untitled"}' restored successfully!`);
      fetchTrash();
    } catch (err: any) {
      setError(err?.message || "Failed to restore proposal");
    } finally {
      setRestoringId(null);
    }
  };

  const filteredItems = items.filter((it) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      it.title.toLowerCase().includes(q) ||
      (it.guestName && it.guestName.toLowerCase().includes(q)) ||
      (it.ownerName && it.ownerName.toLowerCase().includes(q)) ||
      it.destinations.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Trash & Soft-Deleted Proposals
          </h2>
          <p className="text-sm text-muted-foreground">
            Review soft-deleted itineraries. Proposals here are hidden from sales staff but can be restored at any time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrash}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Restore Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-50 text-emerald-950 border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900 font-bold">Restored</AlertTitle>
          <AlertDescription className="text-emerald-800 text-xs">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deleted proposals by title, guest, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[320px]">Proposal Title</TableHead>
              <TableHead>Original Owner</TableHead>
              <TableHead>Destinations & Duration</TableHead>
              <TableHead>Quoted Price</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead className="w-[120px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading trash items...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">Trash is empty</div>
                    <div className="text-xs text-muted-foreground">
                      All active proposals are safe and accounted for.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <div className="font-bold text-foreground text-sm">
                        {item.title || "Untitled Itinerary"}
                      </div>
                      {item.guestName && (
                        <div className="text-xs text-muted-foreground">
                          Guest: {item.guestName}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-muted-foreground/70 truncate max-w-[260px]">
                        ID: {item.id}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{item.ownerName || "Unassigned"}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {item.destinations.length > 0
                            ? item.destinations.join(", ")
                            : "No destinations"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span>
                          {item.daysCount}D / {item.nightsCount}N
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-xs text-foreground">
                      {item.sellingPriceFormatted || "₹0"}
                    </span>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {item.deletedAt
                      ? new Date(item.deletedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently"}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item.id, item.title)}
                      disabled={restoringId === item.id}
                      className="flex items-center gap-1.5 text-xs font-bold hover:border-primary hover:text-primary"
                    >
                      <RotateCcw
                        className={`w-3.5 h-3.5 ${
                          restoringId === item.id ? "animate-spin" : ""
                        }`}
                      />
                      <span>Restore</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
