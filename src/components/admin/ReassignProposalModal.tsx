"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRightLeft, AlertCircle, Loader2 } from "lucide-react";
import { StaffUserSummary } from "@/lib/db/admin";

interface ReassignProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
  proposalTitle: string;
  currentOwnerId?: string | null;
  onSuccess: () => void;
}

export function ReassignProposalModal({
  isOpen,
  onClose,
  proposalId,
  proposalTitle,
  currentOwnerId,
  onSuccess,
}: ReassignProposalModalProps) {
  const [staff, setStaff] = useState<StaffUserSummary[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetch("/api/admin/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.users)) {
            const activeStaff = data.users.filter((u: StaffUserSummary) => !u.banned);
            setStaff(activeStaff);
            // Default to first active staff that isn't the current owner
            const candidate = activeStaff.find((u: StaffUserSummary) => u.id !== currentOwnerId);
            if (candidate) {
              setSelectedStaffId(candidate.id);
            } else if (activeStaff.length > 0) {
              setSelectedStaffId(activeStaff[0].id);
            }
          }
        })
        .catch(() => setError("Failed to load staff list"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentOwnerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError("Please select a new proposal owner.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/itineraries/${proposalId}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId: selectedStaffId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reassign proposal");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error reassigning proposal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Reassign Proposal</DialogTitle>
          <DialogDescription>
            Shift proposal ownership to another advisor. The proposal will immediately relocate to their personal workbench.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs space-y-1">
          <div className="text-muted-foreground font-medium">Target Proposal:</div>
          <div className="text-foreground font-bold text-sm truncate">{proposalTitle || "Untitled"}</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs">Loading active staff...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Select New Owner</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={submitting}
                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — {u.role === "admin" ? "Admin" : "Sales Advisor"}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="mt-6 pt-2 border-t border-border flex gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !selectedStaffId}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Reassigning...
                  </>
                ) : (
                  "Confirm Reassignment"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
