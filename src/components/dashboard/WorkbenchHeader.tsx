"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Settings,
  X,
  Users,
  Trash2,
  ShieldAlert,
  KeyRound,
  LogOut,
  ChevronDown,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface WorkbenchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewModal: () => void;
  isProcessing?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function WorkbenchHeader({
  searchQuery,
  onSearchChange,
  onOpenNewModal,
  isProcessing = false,
  searchInputRef,
}: WorkbenchHeaderProps) {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const isAdmin = user?.role === "admin";

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      window.location.href = "/login";
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs">
            T
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground leading-tight">
            TrippyGo
          </span>
        </Link>

        {/* Global Search Bar (Center / Flexible) */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search proposals... (⌘K)"
              aria-label="Search proposals"
              className="pl-9 pr-9 h-9 text-sm bg-background border-border"
            />
            {searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onSearchChange("")}
                aria-label="Clear search query"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted border border-border rounded pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Action Controls & Session Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Primary Action Button (The single primary on dashboard) */}
          <Button
            variant="default"
            onClick={onOpenNewModal}
            disabled={isProcessing}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New itinerary</span>
            <span className="sm:hidden">New</span>
          </Button>

          {/* User Profile Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={user.name ? `User account: ${user.name}` : "User account menu"}
                    className="flex items-center gap-2 p-1 pl-1.5 rounded-lg border border-border hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar className="size-8 bg-muted text-foreground font-semibold text-xs">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col text-left pr-1">
                      <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider leading-none">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <div className="px-2 py-2 border-b border-border mb-1">
                  <div className="font-semibold text-xs text-foreground truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  <div className="mt-1">
                    {isAdmin ? (
                      <Badge variant="default" className="text-xs h-5 gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Administrator
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs h-5 gap-1">
                        <UserCheck className="w-2.5 h-2.5" /> Sales Advisor
                      </Badge>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/settings")}
                      className="cursor-pointer text-xs"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/admin/users")}
                      className="cursor-pointer text-xs"
                    >
                      <Users className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      Staff Directory
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/admin/trash")}
                      className="cursor-pointer text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      Trash & Restore
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/admin/audit")}
                      className="cursor-pointer text-xs"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      Audit Ledger
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem
                  onClick={() => router.push("/reset-password")}
                  className="cursor-pointer text-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  Change Password
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="cursor-pointer text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search proposals..."
            aria-label="Search proposals on mobile"
            className="pl-9 pr-8 text-xs bg-background border-border"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onSearchChange("")}
              aria-label="Clear mobile search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
