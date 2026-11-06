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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { StaffUserSummary } from "@/lib/db/admin";
import {
  UserPlus,
  MoreVertical,
  ShieldCheck,
  UserCheck,
  KeyRound,
  UserX,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Copy,
  Check,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [resetModalInfo, setResetModalInfo] = useState<{
    name: string;
    email: string;
    resetUrl: string;
  } | null>(null);
  const [copiedResetLink, setCopiedResetLink] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch {
      setActionError("Failed to fetch staff directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (user: StaffUserSummary) => {
    setActionError(null);
    setActionSuccess(null);
    const newRole = user.role === "admin" ? "salesperson" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setActionSuccess(`Updated ${user.name}'s role to ${newRole === "admin" ? "Administrator" : "Salesperson"}`);
      fetchUsers();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update role");
    }
  };

  const handleBanToggle = async (user: StaffUserSummary) => {
    setActionError(null);
    setActionSuccess(null);
    const newBanned = !user.banned;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: newBanned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account status");
      setActionSuccess(
        newBanned
          ? `Deactivated account for ${user.name}`
          : `Reactivated account for ${user.name}`
      );
      fetchUsers();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update status");
    }
  };

  const handlePasswordReset = async (user: StaffUserSummary) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      setActionSuccess(`Password reset email dispatched to ${user.email}`);
      if (data.resetUrl) {
        setResetModalInfo({
          name: user.name,
          email: user.email,
          resetUrl: data.resetUrl,
        });
        setCopiedResetLink(false);
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to trigger reset email");
    }
  };

  const handleCopyResetLink = async () => {
    if (!resetModalInfo?.resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetModalInfo.resetUrl);
      setCopiedResetLink(true);
      setTimeout(() => setCopiedResetLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const activeAdminsCount = users.filter((u) => u.role === "admin" && !u.banned).length;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Staff & Access Directory
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage sales advisors, administrative privileges, invitations and account standing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 font-bold"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Staff</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Action Rejected</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {actionSuccess && (
        <Alert className="bg-emerald-50 text-emerald-950 border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900 font-bold">Success</AlertTitle>
          <AlertDescription className="text-emerald-800 text-xs">
            {actionSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[320px]">Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Proposals</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading staff directory...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No staff members match the query.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isOnlyAdmin = user.role === "admin" && !user.banned && activeAdminsCount <= 1;
                const initials = user.name
                  .split(" ")
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "U";

                return (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground text-sm flex items-center gap-2">
                            {user.name}
                            {isOnlyAdmin && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                Primary Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="default" className="gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          Administrator
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 font-semibold">
                          <UserCheck className="w-3 h-3" />
                          Sales Advisor
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <span className="size-1.5 rounded-full bg-emerald-600"></span>
                          Active
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-xs text-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        {user.itineraryCount}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="sm" className="size-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleRoleToggle(user)}
                            disabled={isOnlyAdmin}
                            className="cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            {user.role === "admin" ? "Demote to Sales" : "Promote to Admin"}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handlePasswordReset(user)}
                            className="cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Send Password Reset
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleBanToggle(user)}
                            disabled={isOnlyAdmin}
                            className={
                              user.banned
                                ? "text-emerald-700 cursor-pointer"
                                : "text-destructive cursor-pointer"
                            }
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {user.banned ? "Reactivate Staff" : "Deactivate Staff"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* Direct Password Reset Link Modal */}
      <Dialog open={!!resetModalInfo} onOpenChange={(open) => !open && setResetModalInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Password Reset Link</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              A single-use password reset link for <span className="font-semibold text-slate-800">{resetModalInfo?.name}</span> ({resetModalInfo?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Direct Reset URL (Expires in 1 Hour)
              </span>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={resetModalInfo?.resetUrl || ""}
                  className="bg-white text-xs font-mono select-all h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 shrink-0 gap-1.5"
                  onClick={handleCopyResetLink}
                >
                  {copiedResetLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-[12px] text-slate-500 leading-relaxed">
              If transactional email delivery is delayed, you can copy and share this link directly with the staff member.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="w-full bg-[#091c3e] hover:bg-[#1556a6] text-white"
              onClick={() => setResetModalInfo(null)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
