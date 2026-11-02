"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  MoreHorizontal,
  Copy,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ItinerarySummary } from "@/lib/db/itineraries";

function formatDestinationsAndDates(item: ItinerarySummary): string {
  const parts: string[] = [];

  // Destinations
  if (item.destinations && item.destinations.length > 0) {
    parts.push(item.destinations.join(", "));
  } else {
    parts.push("Flexible destination");
  }

  // Start Date (e.g. "5 Nov")
  if (item.startDate) {
    try {
      const d = new Date(item.startDate);
      if (!isNaN(d.getTime())) {
        const formattedDate = d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        parts.push(formattedDate);
      }
    } catch {
      // ignore
    }
  }

  // Duration
  parts.push(`${item.nightsCount}N/${item.daysCount}D`);

  return parts.join(" · ");
}

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

interface ItineraryTableProps {
  itineraries: ItinerarySummary[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  isDeletingId: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function ItineraryTable({
  itineraries,
  isLoading,
  onDelete,
  onDuplicate,
  isDeletingId,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: ItineraryTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<ItinerarySummary | null>(null);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border overflow-hidden p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center justify-between py-3 border-b border-border/50 last:border-0"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted/60 rounded w-1/4" />
            </div>
            <div className="h-4 bg-muted/60 rounded w-20 mx-4 hidden sm:block" />
            <div className="h-8 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * 20 + 1;
  const endItem = Math.min(currentPage * 20, totalItems);

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-3 px-3 sm:px-4 font-semibold text-xs text-muted-foreground">
                Proposal & client
              </TableHead>
              <TableHead className="py-3 px-2 sm:px-4 font-semibold text-xs text-muted-foreground">
                Destinations & dates
              </TableHead>
              <TableHead className="py-3 px-2 sm:px-4 font-semibold text-xs text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="py-3 px-2 sm:px-4 font-semibold text-xs text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="py-3 px-2 sm:px-4 font-semibold text-xs text-muted-foreground hidden lg:table-cell">
                Updated
              </TableHead>
              <TableHead className="py-3 px-2 sm:px-4 text-right font-semibold text-xs text-muted-foreground w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itineraries.map((item) => {
              const priceDisplay =
                item.sellingPricePaise > 0 ? item.sellingPriceFormatted : "—";

              return (
                <TableRow
                  key={item.id}
                  onClick={() => router.push(`/itineraries/${item.id}/edit`)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {/* Proposal & Client */}
                  <TableCell className="py-3.5 px-3 sm:px-4">
                    <Link
                      href={`/itineraries/${item.id}/edit`}
                      className="font-semibold text-foreground hover:underline truncate max-w-[180px] lg:max-w-xs block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px] lg:max-w-xs">
                      {item.guestName ? `Client: ${item.guestName}` : "—"}
                    </div>
                  </TableCell>

                  {/* Destinations & Dates (e.g. Phuket, Krabi · 5 Nov · 7N/8D) */}
                  <TableCell className="py-3.5 px-2 sm:px-4">
                    <span className="text-xs text-foreground truncate block max-w-[170px] lg:max-w-sm">
                      {formatDestinationsAndDates(item)}
                    </span>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="py-3.5 px-2 sm:px-4">
                    <span className="text-xs font-semibold text-foreground">
                      {priceDisplay}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-2 sm:px-4">
                    {item.status === "generated" ? (
                      <Badge variant="success">
                        PDF ready
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Draft
                      </Badge>
                    )}
                  </TableCell>

                  {/* Updated */}
                  <TableCell className="py-3.5 px-2 sm:px-4 text-xs text-muted-foreground hidden lg:table-cell">
                    {formatRelativeTime(item.updatedAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 px-2 sm:px-4 text-right">
                    <div
                      className="inline-flex items-center gap-1 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.hasPdf && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            window.open(
                              item.lastPdfUrl || `/api/itineraries/${item.id}/pdf`,
                              "_blank"
                            )
                          }
                          title="View Client PDF"
                          aria-label="View Client PDF"
                        >
                          <FileText className="size-4 text-success" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="size-4 text-muted-foreground" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => onDuplicate(item.id)}
                            className="cursor-pointer text-xs"
                          >
                            <Copy className="size-3.5 mr-2 text-muted-foreground" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(item)}
                            variant="destructive"
                            className="cursor-pointer text-xs"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6">
            <div className="text-xs text-muted-foreground">
              Showing {startItem}–{endItem} of {totalItems} proposals
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-3">
        {itineraries.map((item) => {
          const priceDisplay =
            item.sellingPricePaise > 0 ? item.sellingPriceFormatted : "—";

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/itineraries/${item.id}/edit`)}
              className="bg-card p-4 rounded-lg border border-border shadow-xs space-y-3 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/itineraries/${item.id}/edit`}
                    className="font-semibold text-foreground text-sm hover:underline block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.guestName ? `Client: ${item.guestName}` : "—"}
                  </div>
                </div>

                {item.status === "generated" ? (
                  <Badge variant="success" className="shrink-0">
                    PDF ready
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground shrink-0">
                    Draft
                  </Badge>
                )}
              </div>

              <div className="text-xs text-foreground bg-muted/40 p-2.5 rounded-md border border-border/50">
                <div className="truncate">{formatDestinationsAndDates(item)}</div>
                <div className="flex items-center justify-between pt-1 mt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-foreground">{priceDisplay}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  Updated {formatRelativeTime(item.updatedAt)}
                </span>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.hasPdf && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        window.open(
                          item.lastPdfUrl || `/api/itineraries/${item.id}/pdf`,
                          "_blank"
                        )
                      }
                      title="View Client PDF"
                      aria-label="View Client PDF"
                    >
                      <FileText className="size-4 text-success" />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="size-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() => onDuplicate(item.id)}
                        className="cursor-pointer text-xs"
                      >
                        <Copy className="size-3.5 mr-2 text-muted-foreground" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(item)}
                        variant="destructive"
                        className="cursor-pointer text-xs"
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Soft Delete Confirmation Modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move itinerary to trash?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title || "This itinerary"}&rdquo; will be moved to
              trash. You can restore it later from Trash.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeletingId === deleteTarget?.id}
              onClick={async () => {
                if (deleteTarget) {
                  await onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
