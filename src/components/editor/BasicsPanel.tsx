"use client";

import React, { useState, useMemo } from "react";
import { Package, SalespersonContact } from "@/lib/schema/itinerary";
import {
  ClipboardList,
  RotateCcw,
  X,
  Check,
  Compass,
  UserCheck,
  Calendar,
  Users,
  Image as ImageIcon,
  AlertTriangle,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import ImagePickerModal from "./ImagePickerModal";

interface BasicsPanelProps {
  packageData: Package;
  onChange: (updated: Package) => void;
  salesperson?: SalespersonContact;
  onSalespersonChange?: (updated: SalespersonContact) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
  extractedSnapshot?: any;
}

export default function BasicsPanel({
  packageData,
  onChange,
  salesperson,
  onSalespersonChange,
  reviewFlags = [],
  extractedSnapshot,
}: BasicsPanelProps) {
  const [newDest, setNewDest] = useState("");
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const getFlag = (fieldName: string) => {
    return reviewFlags.find((f) => f.field === `package.${fieldName}` || f.field === fieldName);
  };

  const handleAddDestination = () => {
    if (!newDest.trim()) return;
    const trimmed = newDest.trim();
    if (!packageData.destinations.includes(trimmed)) {
      onChange({
        ...packageData,
        destinations: [...packageData.destinations, trimmed],
      });
    }
    setNewDest("");
  };

  const handleRemoveDestination = (dest: string) => {
    onChange({
      ...packageData,
      destinations: packageData.destinations.filter((d) => d !== dest),
    });
  };

  // Bidirectional auto-calculation: Nights -> Days
  const handleNightsChange = (rawNights: number) => {
    const nights = Math.max(0, rawNights);
    onChange({
      ...packageData,
      nights,
      days: nights + 1, // Auto-set days = nights + 1
    });
  };

  // Bidirectional auto-calculation: Days -> Nights
  const handleDaysChange = (rawDays: number) => {
    const days = Math.max(1, rawDays);
    onChange({
      ...packageData,
      days,
      nights: Math.max(0, days - 1), // Auto-set nights = days - 1
    });
  };

  // Compute End Date with useMemo
  const computedEndDate = useMemo(() => {
    if (!packageData.startDate) return "TBD";
    const [y, m, d] = packageData.startDate.split("-").map(Number);
    if (!y || !m || !d) return "TBD";
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + (packageData.nights || 0));
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  }, [packageData.startDate, packageData.nights]);

  const titleFlag = getFlag("title");
  const destFlag = getFlag("destinations");
  const daysFlag = getFlag("days");

  return (
    <div className="bg-card text-card-foreground rounded-xl p-5 sm:p-6 border border-border shadow-2xs space-y-6">
      {/* 1. PANEL HEADER */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>Trip overview & logistics</span>
        </h2>
        {extractedSnapshot?.rawTitle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...packageData, title: extractedSnapshot.rawTitle })}
            title="Reset title to extracted value"
            aria-label="Reset title to extracted value"
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to extracted</span>
          </Button>
        )}
      </div>

      {/* 2. SECTION 1: TRIP IDENTITY (DESIGN.md 7.4) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="basic-package-title"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Package title * <span className="text-muted-foreground font-normal">(cover headline)</span>
            </label>
            <Input
              id="basic-package-title"
              type="text"
              value={packageData.title}
              onChange={(e) => onChange({ ...packageData, title: e.target.value })}
              className={`font-medium ${
                titleFlag ? "border-amber-500 bg-amber-500/10 focus-visible:ring-amber-500" : ""
              }`}
              placeholder="e.g. 7 Days Kashmir Paradise Tour"
            />
            {titleFlag && (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-200 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{titleFlag.issue}</span>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="basic-guest-name"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Guest name / Party * <span className="text-muted-foreground font-normal">(printed on proposal)</span>
            </label>
            <Input
              id="basic-guest-name"
              type="text"
              value={packageData.guestName}
              onChange={(e) => onChange({ ...packageData, guestName: e.target.value })}
              className="font-medium"
              placeholder="e.g. Mr. Sharma & Family"
            />
          </div>
        </div>

        {/* Destinations Circuit */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Destinations circuit *
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {packageData.destinations.map((dest) => (
              <Badge
                key={dest}
                variant="secondary"
                className="pl-2.5 pr-1 py-1 text-xs gap-1.5 font-medium items-center"
              >
                <span>{dest}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDestination(dest)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={`Remove destination ${dest}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDestination();
                }
              }}
              placeholder="Add destination (e.g. Gulmarg) and press Enter"
              className="text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddDestination}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              <span>Add</span>
            </Button>
          </div>
          {destFlag && (
            <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-200 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{destFlag.issue}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* 3. SECTION 2: DURATION, DATES & TRAVELLERS (DESIGN.md 7.4) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">
            Duration & travel dates
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Nights with sync tooltip */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label htmlFor="basic-nights" className="text-xs font-medium text-muted-foreground">
                Nights
              </label>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Duration sync explanation"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted text-muted-foreground cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  }
                />
                <TooltipContent>Days and nights stay in sync.</TooltipContent>
              </Tooltip>
            </div>
            <NumberInput
              id="basic-nights"
              min={0}
              fallbackValue={0}
              value={packageData.nights}
              onChange={(val) => handleNightsChange(val)}
              className="font-medium"
            />
          </div>

          {/* Days with sync tooltip */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label htmlFor="basic-days" className="text-xs font-medium text-muted-foreground">
                Days
              </label>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Duration sync explanation"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted text-muted-foreground cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  }
                />
                <TooltipContent>Days and nights stay in sync.</TooltipContent>
              </Tooltip>
            </div>
            <NumberInput
              id="basic-days"
              min={1}
              fallbackValue={1}
              value={packageData.days}
              onChange={(val) => handleDaysChange(val)}
              className={`font-medium ${
                daysFlag ? "border-amber-500 bg-amber-500/10 focus-visible:ring-amber-500" : ""
              }`}
            />
            {daysFlag && (
              <span className="text-xs text-amber-800 dark:text-amber-200 mt-1 block">{daysFlag.issue}</span>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="basic-start-date" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Start date
            </label>
            <Input
              id="basic-start-date"
              type="date"
              value={packageData.startDate || ""}
              onChange={(e) => onChange({ ...packageData, startDate: e.target.value || null })}
              className="font-medium"
            />
          </div>

          {/* End Date (Computed read-only with semantic <output>) */}
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">
              End date (computed)
            </span>
            <output
              id="basic-computed-end-date"
              aria-live="polite"
              className="h-9 px-3 py-2 text-sm font-medium rounded-md bg-muted/40 text-foreground border border-border truncate flex items-center"
            >
              {computedEndDate}
            </output>
          </div>
        </div>

        {/* Travellers & Accommodation Strip */}
        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">
              Travellers & accommodation
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="basic-adults" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Adults (12+ yrs)
              </label>
              <NumberInput
                id="basic-adults"
                min={1}
                fallbackValue={1}
                value={packageData.travellers.adults}
                onChange={(val) =>
                  onChange({
                    ...packageData,
                    travellers: {
                      ...packageData.travellers,
                      adults: val,
                    },
                  })
                }
                className="font-medium"
              />
            </div>

            <div>
              <label htmlFor="basic-children" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Children (2-12 yrs)
              </label>
              <NumberInput
                id="basic-children"
                min={0}
                fallbackValue={0}
                value={packageData.travellers.children ?? 0}
                onChange={(val) =>
                  onChange({
                    ...packageData,
                    travellers: {
                      ...packageData.travellers,
                      children: val,
                    },
                  })
                }
                className="font-medium"
              />
            </div>

            <div>
              <label htmlFor="basic-infants" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Infants (under 2)
              </label>
              <NumberInput
                id="basic-infants"
                min={0}
                fallbackValue={0}
                value={packageData.travellers.infants ?? 0}
                onChange={(val) =>
                  onChange({
                    ...packageData,
                    travellers: {
                      ...packageData.travellers,
                      infants: val,
                    },
                  })
                }
                className="font-medium"
              />
            </div>

            <div>
              <label htmlFor="basic-rooms" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Rooms required
              </label>
              <NumberInput
                id="basic-rooms"
                min={1}
                fallbackValue={1}
                value={packageData.travellers.rooms}
                onChange={(val) =>
                  onChange({
                    ...packageData,
                    travellers: {
                      ...packageData.travellers,
                      rooms: val,
                    },
                  })
                }
                className="font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* 4. SECTION 3: COVER PHOTO (DESIGN.md 7.4) */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Portrait Thumbnail Preview with semantic <button> */}
          <button
            type="button"
            onClick={() => setIsCoverPickerOpen(true)}
            title="Click to choose or change cover photo"
            aria-label="Click to choose or change cover photo"
            className="relative w-20 sm:w-24 aspect-[1/1.414] rounded-md overflow-hidden border border-border bg-muted group cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none shadow-2xs"
          >
            <img
              src={
                packageData.coverImage?.imageUrl ||
                "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80"
              }
              alt="Cover Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-foreground text-xs font-medium text-center p-1">
              <span>Change</span>
            </div>
          </button>

          {/* Details & Action Controls */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">
                  Cover photo
                </h3>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {packageData.coverImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ ...packageData, coverImage: null })}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reset to auto
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCoverPickerOpen(true)}
                  className="h-8 text-xs gap-1.5 font-medium"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{packageData.coverImage ? "Change cover" : "Choose cover"}</span>
                </Button>
              </div>
            </div>

            {/* Status copy per UI_DECISIONS.md & DESIGN.md */}
            <div className="text-xs text-muted-foreground">
              {packageData.coverImage ? (
                <span className="text-foreground font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Custom cover active: <strong className="font-semibold">{packageData.coverImage.photographerName || "Selected photo"}</strong>
                  </span>
                </span>
              ) : (
                <span>
                  Using a photo from Day 1. Choose a cover for a stronger first page.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* 5. COLLAPSIBLE CONTACT DETAILS (PREFILLED FROM USER SESSION, COLLAPSED BY DEFAULT) */}
      <Collapsible open={isContactOpen} onOpenChange={setIsContactOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition group cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Your contact details (printed on proposal)</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isContactOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            }
          />
        </div>

        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Trip specialist name
              </label>
              <Input
                id="contact-name"
                type="text"
                value={salesperson?.name || ""}
                onChange={(e) => onSalespersonChange?.({ ...salesperson, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="font-medium"
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Direct phone / WhatsApp
              </label>
              <Input
                id="contact-phone"
                type="text"
                value={salesperson?.phone || ""}
                onChange={(e) => onSalespersonChange?.({ ...salesperson, phone: e.target.value })}
                placeholder="e.g. +91 98765 12345"
                className="font-medium"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Official email
              </label>
              <Input
                id="contact-email"
                type="email"
                value={salesperson?.email || ""}
                onChange={(e) => onSalespersonChange?.({ ...salesperson, email: e.target.value })}
                placeholder="e.g. rahul@trippygo.com"
                className="font-medium"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Cover Image Picker & Cropper Dialog */}
      <ImagePickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        mode="cover"
        initialQuery={packageData.destinations[0] || packageData.title}
        destinationFallback={packageData.destinations[0] || "Dubai"}
        currentImage={packageData.coverImage}
        packageTitle={packageData.title}
        guestName={packageData.guestName}
        onSelectImage={(img) => {
          onChange({
            ...packageData,
            coverImage: img,
          });
        }}
      />
    </div>
  );
}
