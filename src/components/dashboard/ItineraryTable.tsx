"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  MapPin,
  ExternalLink,
  Trash2,
  Edit3,
  Clock,
  User,
  CheckCircle2,
} from "lucide-react";
import { ItinerarySummary } from "@/lib/db/itineraries";

function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
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
  isDeletingId: string | null;
}

export function ItineraryTable({
  itineraries,
  isLoading,
  onDelete,
  isDeletingId,
}: ItineraryTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-20 mx-4 hidden sm:block" />
            <div className="h-8 bg-slate-200 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-6">Proposal & Client</th>
              <th className="py-3.5 px-4">Destinations & Duration</th>
              <th className="py-3.5 px-4">Selling Price</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Updated</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {itineraries.map((item) => {
              const isDeleting = isDeletingId === item.id;
              const isConfirming = confirmDeleteId === item.id;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition group"
                >
                  {/* Proposal Title & Client */}
                  <td className="py-4 px-6">
                    <Link
                      href={`/itineraries/${item.id}/edit`}
                      className="font-bold text-slate-900 group-hover:text-[#091c3e] hover:underline flex items-baseline gap-2"
                    >
                      <span className="truncate max-w-xs">{item.title}</span>
                    </Link>
                    {item.guestName ? (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Client: {item.guestName}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-0.5">Unassigned Client</div>
                    )}
                  </td>

                  {/* Destinations & Duration */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {item.destinations.length > 0
                          ? item.destinations.join(", ")
                          : "Flexible Destination"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>
                        {item.nightsCount}N / {item.daysCount}D
                        {item.startDate && ` • Starts ${formatDate(item.startDate)}`}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {item.sellingPricePaise > 0 ? (
                      <span className="text-sm font-bold text-[#091c3e]">
                        {item.sellingPriceFormatted}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Unpriced Draft</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    {item.status === "generated" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        PDF Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </td>

                  {/* Last Updated */}
                  <td className="py-4 px-4 text-xs text-slate-600">
                    {formatRelativeTime(item.updatedAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <Link
                        href={`/itineraries/${item.id}/edit`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#091c3e] focus-visible:outline-none"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </Link>

                      {item.hasPdf && (
                        <Link
                          href={`/print/${item.id}?preview=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#091c3e] focus-visible:outline-none"
                          title="View Client PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      )}

                      {isConfirming ? (
                        <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(item.id);
                              setConfirmDeleteId(null);
                            }}
                            disabled={isDeleting}
                            className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 text-xs text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={isDeleting}
                          aria-label={`Delete itinerary ${item.title}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                          title="Delete itinerary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-3">
        {itineraries.map((item) => {
          const isDeleting = isDeletingId === item.id;
          const isConfirming = confirmDeleteId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/itineraries/${item.id}/edit`}
                    className="font-bold text-slate-900 text-sm hover:underline block"
                  >
                    {item.title}
                  </Link>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {item.guestName ? `Client: ${item.guestName}` : "Unassigned Client"}
                  </div>
                </div>

                {item.status === "generated" ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    PDF Ready
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Draft
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    {item.destinations.length > 0
                      ? item.destinations.join(", ")
                      : "Flexible Destination"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                  <span>
                    {item.nightsCount}N / {item.daysCount}D
                  </span>
                  <span className="font-bold text-slate-900">
                    {item.sellingPricePaise > 0 ? item.sellingPriceFormatted : "Unpriced"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Updated {formatRelativeTime(item.updatedAt)}
                </span>

                <div className="flex items-center gap-2">
                  {isConfirming ? (
                    <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-md border border-red-200">
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(item.id);
                          setConfirmDeleteId(null);
                        }}
                        disabled={isDeleting}
                        className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    href={`/itineraries/${item.id}/edit`}
                    className="px-3 py-1.5 bg-[#091c3e] text-white text-xs font-bold rounded-lg"
                  >
                    Edit Itinerary
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
