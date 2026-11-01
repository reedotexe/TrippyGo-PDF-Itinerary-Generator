"use client";

import React, { useState, useRef } from "react";
import { ItineraryDay } from "@/lib/schema/itinerary";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  Check,
  CalendarDays,
  Utensils,
  Coffee,
  Moon,
  Sparkles,
  Bed,
  MapPin,
  Building,
} from "lucide-react";
import ImagePickerModal from "./ImagePickerModal";

interface DaysPanelProps {
  days: ItineraryDay[];
  onChange: (updatedDays: ItineraryDay[]) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

const COMMON_ACTIVITY_PRESETS = [
  "City Tour",
  "Leisure & Shopping",
  "Sunset Cruise",
  "Sightseeing & Photography",
  "Local Market Walk",
  "Cultural Show",
  "Beach Relaxation",
  "Adventure Sports",
];

export default function DaysPanel({
  days,
  onChange,
  reviewFlags = [],
}: DaysPanelProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [newActivity, setNewActivity] = useState<Record<number, string>>({});
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const stepperScrollRef = useRef<HTMLDivElement>(null);

  const getFlag = (dayIndex: number, fieldName: string) => {
    return reviewFlags.find(
      (f) =>
        f.field === `days.${dayIndex}.${fieldName}` ||
        f.field === `days.${dayIndex}`
    );
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= days.length) return;

    const copy = [...days];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Renumber days sequentially
    const renumbered = copy.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    onChange(renumbered);
    setActiveTab(targetIndex + 1);
  };

  const handleAddDay = () => {
    const newDayNum = days.length + 1;
    const newDay: ItineraryDay = {
      dayNumber: newDayNum,
      title: `Day ${newDayNum} Exploration`,
      description: "Day activities and leisure.",
      activities: [],
      meals: ["Breakfast"],
      stay: null,
      imageQuery: "",
      image: null,
    };
    onChange([...days, newDay]);
    setActiveTab(newDayNum);

    // Scroll stepper to end
    setTimeout(() => {
      if (stepperScrollRef.current) {
        stepperScrollRef.current.scrollTo({
          left: stepperScrollRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleDuplicateDay = (index: number) => {
    const source = days[index];
    const copy = [...days];
    const duplicated: ItineraryDay = {
      ...source,
      title: `${source.title} (Copy)`,
      dayNumber: index + 2,
    };
    copy.splice(index + 1, 0, duplicated);

    const renumbered = copy.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    onChange(renumbered);
    setActiveTab(index + 2);
  };

  const handleDeleteDay = (index: number) => {
    if (days.length <= 1) {
      alert("Itinerary must contain at least 1 day.");
      return;
    }
    const filtered = days.filter((_, i) => i !== index);
    const renumbered = filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    onChange(renumbered);
    setActiveTab(Math.min(activeTab, renumbered.length));
  };

  const handleUpdateDay = (
    index: number,
    updatedFields: Partial<ItineraryDay>
  ) => {
    const updated = days.map((d, i) =>
      i === index ? { ...d, ...updatedFields } : d
    );
    onChange(updated);
  };

  const handleToggleMeal = (dayIndex: number, meal: string) => {
    const currentMeals = days[dayIndex].meals || [];
    const newMeals = currentMeals.includes(meal)
      ? currentMeals.filter((m) => m !== meal)
      : [...currentMeals, meal];
    handleUpdateDay(dayIndex, { meals: newMeals });
  };

  const handleAddActivity = (dayIndex: number, activityText?: string) => {
    const text = (activityText || newActivity[dayIndex] || "").trim();
    if (!text) return;
    const currentActs = days[dayIndex].activities || [];
    if (!currentActs.includes(text)) {
      handleUpdateDay(dayIndex, { activities: [...currentActs, text] });
    }
    setNewActivity({ ...newActivity, [dayIndex]: "" });
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    const currentActs = days[dayIndex].activities || [];
    handleUpdateDay(dayIndex, {
      activities: currentActs.filter((_, i) => i !== actIndex),
    });
  };

  const scrollStepper = (direction: "left" | "right") => {
    if (stepperScrollRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      stepperScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const currentDay = days[activeTab - 1] || days[0];
  const currentIndex = activeTab - 1;

  if (!currentDay) return null;

  const titleFlag = getFlag(currentIndex, "title");
  const descFlag = getFlag(currentIndex, "description");
  const hotelFlag = getFlag(currentIndex, "stay.hotel");

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 font-body">
      {/* 1. HEADER BAR: Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#091c3e] text-white shadow-2xs">
              <CalendarDays className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Day-by-Day Journey Plan
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {days.length} Day{days.length > 1 ? "s" : ""} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily itinerary narratives, stays, meals, and curated visual photo banners.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddDay}
          className="px-3.5 py-2 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Add Day</span>
        </button>
      </div>

      {/* 2. FIX 4.1: HORIZONTAL DAY STEPPER (Smooth scrollable pills) */}
      <div className="relative flex items-center gap-1">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scrollStepper("left")}
          aria-label="Scroll days left"
          className="w-7 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 transition shadow-2xs disabled:opacity-30"
          title="Scroll days left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable Day Stepper Pills Container */}
        <div
          ref={stepperScrollRef}
          role="tablist"
          aria-label="Itinerary Days Stepper"
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1"
        >
          {days.map((day, i) => {
            const hasFlag = reviewFlags.some((f) =>
              f.field.startsWith(`days.${i}`)
            );
            const isActive = activeTab === day.dayNumber;
            const paddedNum = String(day.dayNumber).padStart(2, "0");
            const stayLocation = day.stay?.city || day.stay?.hotel || "";

            return (
              <button
                key={day.dayNumber}
                type="button"
                id={`day-tab-${day.dayNumber}`}
                role="tab"
                aria-selected={isActive}
                aria-controls="panel-day-content"
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(day.dayNumber)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    const nextDay = days[(i + 1) % days.length];
                    setActiveTab(nextDay.dayNumber);
                    document.getElementById(`day-tab-${nextDay.dayNumber}`)?.focus();
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    const prevDay = days[(i - 1 + days.length) % days.length];
                    setActiveTab(prevDay.dayNumber);
                    document.getElementById(`day-tab-${prevDay.dayNumber}`)?.focus();
                  }
                }}
                className={`group px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? "bg-[#091c3e] text-white border-[#091c3e] shadow-xs ring-2 ring-[#091c3e]/15"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100/90 border-slate-200 hover:border-slate-300"
                } ${hasFlag ? "ring-2 ring-amber-400" : ""}`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span>Day {paddedNum}</span>
                    {hasFlag && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  {stayLocation && (
                    <span
                      className={`text-[9px] font-normal truncate max-w-[80px] -mt-0.5 ${
                        isActive ? "text-amber-300/90" : "text-slate-400"
                      }`}
                    >
                      {stayLocation}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => scrollStepper("right")}
          aria-label="Scroll days right"
          className="w-7 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 transition shadow-2xs disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Scroll days right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. ACTIVE DAY DETAIL WORKBENCH */}
      <div
        id="panel-day-content"
        role="tabpanel"
        aria-labelledby={`day-tab-${currentDay.dayNumber}`}
        className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-5 shadow-2xs"
      >
        {/* Workbench Top Bar: Sequence Indicator & Reorder Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#091c3e] text-white flex items-center justify-center text-xs font-bold shadow-2xs font-mono">
              #{String(currentDay.dayNumber).padStart(2, "0")}
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Editing Day {currentDay.dayNumber} of {days.length}
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Changes autosave instantly to itinerary state.
              </span>
            </div>
          </div>

          {/* Reorder and Duplicate Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => handleMove(currentIndex, "up")}
              title="Move day earlier"
              aria-label="Move day earlier"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentIndex === days.length - 1}
              onClick={() => handleMove(currentIndex, "down")}
              title="Move day later"
              aria-label="Move day later"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDuplicateDay(currentIndex)}
              title="Duplicate this day"
              aria-label="Duplicate this day"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteDay(currentIndex)}
              title="Delete this day"
              aria-label="Delete this day"
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Title Input */}
        <div>
          <label
            htmlFor={`day-${currentIndex}-title`}
            className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Day Title *
          </label>
          <input
            id={`day-${currentIndex}-title`}
            type="text"
            value={currentDay.title}
            onChange={(e) =>
              handleUpdateDay(currentIndex, { title: e.target.value })
            }
            className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border focus-visible:outline-none focus-visible:ring-2 transition ${
              titleFlag
                ? "border-amber-400 bg-amber-50/40 focus-visible:ring-amber-400"
                : "border-slate-300 focus-visible:ring-blue-500 bg-white"
            }`}
            placeholder="e.g. Arrival in Srinagar & Sunset Shikara Ride on Dal Lake"
          />
          {titleFlag && (
            <div className="mt-1 text-xs text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{titleFlag.issue}</span>
            </div>
          )}
        </div>

        {/* Day Narrative Description */}
        <div>
          <label
            htmlFor={`day-${currentIndex}-desc`}
            className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Day Narrative & Schedule
          </label>
          <textarea
            id={`day-${currentIndex}-desc`}
            rows={3}
            value={currentDay.description}
            onChange={(e) =>
              handleUpdateDay(currentIndex, { description: e.target.value })
            }
            className={`w-full px-3 py-2 text-xs rounded-lg border focus-visible:outline-none focus-visible:ring-2 leading-relaxed transition ${
              descFlag
                ? "border-amber-400 bg-amber-50/40 focus-visible:ring-amber-400"
                : "border-slate-300 focus-visible:ring-blue-500 bg-white"
            }`}
            placeholder="Describe the day's journey, sightseeing highlights, transfers, and leisure time in detail..."
          />
          {descFlag && (
            <div className="mt-1 text-xs text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{descFlag.issue}</span>
            </div>
          )}
        </div>

        {/* FIX 4.3: INLINE STAY & MEALS (Combined 3-column stay strip + toggleable meal badges) */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Bed className="w-3.5 h-3.5 text-blue-600" />
              <span>Stay & Accommodation</span>
            </span>

            {/* 3-Column Inline Stay Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Hotel / Property Name */}
              <div>
                <label
                  htmlFor={`day-${currentIndex}-stay-hotel`}
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
                >
                  Hotel / Property Name
                </label>
                <div className="relative">
                  <input
                    id={`day-${currentIndex}-stay-hotel`}
                    type="text"
                    value={currentDay.stay?.hotel || ""}
                    onChange={(e) =>
                      handleUpdateDay(currentIndex, {
                        stay: {
                          hotel: e.target.value || null,
                          city: currentDay.stay?.city || null,
                          roomType: currentDay.stay?.roomType || null,
                        },
                      })
                    }
                    placeholder="e.g. Hotel Pine Spring"
                    className={`w-full pl-7 pr-2.5 py-1.5 text-xs font-semibold rounded-lg border focus-visible:outline-none focus-visible:ring-2 transition ${
                      hotelFlag
                        ? "border-amber-400 bg-amber-50/40 focus-visible:ring-amber-400"
                        : "border-slate-300 focus-visible:ring-blue-500 bg-white"
                    }`}
                  />
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                </div>
                {hotelFlag && (
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    {hotelFlag.issue}
                  </span>
                )}
              </div>

              {/* City / Region */}
              <div>
                <label
                  htmlFor={`day-${currentIndex}-stay-city`}
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
                >
                  City / Location
                </label>
                <div className="relative">
                  <input
                    id={`day-${currentIndex}-stay-city`}
                    type="text"
                    value={currentDay.stay?.city || ""}
                    onChange={(e) =>
                      handleUpdateDay(currentIndex, {
                        stay: {
                          hotel: currentDay.stay?.hotel || null,
                          city: e.target.value || null,
                          roomType: currentDay.stay?.roomType || null,
                        },
                      })
                    }
                    placeholder="e.g. Srinagar"
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white transition"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Room Category */}
              <div>
                <label
                  htmlFor={`day-${currentIndex}-stay-room`}
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
                >
                  Room Category / Type
                </label>
                <input
                  id={`day-${currentIndex}-stay-room`}
                  type="text"
                  value={currentDay.stay?.roomType || ""}
                  onChange={(e) =>
                    handleUpdateDay(currentIndex, {
                      stay: {
                        hotel: currentDay.stay?.hotel || null,
                        city: currentDay.stay?.city || null,
                        roomType: e.target.value || null,
                      },
                    })
                  }
                  placeholder="e.g. Deluxe Lake View"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Meals Included: Toggleable Badge Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Meals Included
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { name: "Breakfast", icon: Coffee },
                { name: "Lunch", icon: Utensils },
                { name: "Dinner", icon: Moon },
              ].map(({ name, icon: Icon }) => {
                const isChecked = currentDay.meals?.includes(name);

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleToggleMeal(currentIndex, name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 select-none ${
                      isChecked
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isChecked ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{name}</span>
                    {isChecked ? (
                      <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                    ) : (
                      <span className="text-[10px] text-slate-400 ml-0.5">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FIX 4.4: TAG-BASED ACTIVITIES & QUICK SUGGESTIONS */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Activities & Sightseeing Highlights
          </label>

          {/* Existing Activity Tags */}
          <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
            {currentDay.activities && currentDay.activities.length > 0 ? (
              currentDay.activities.map((act, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                >
                  <span>{act}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(currentIndex, i)}
                    aria-label={`Remove activity ${act}`}
                    className="w-4 h-4 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">
                No activities added for this day yet.
              </span>
            )}
          </div>

          {/* Inline Add Activity Input */}
          <div className="flex gap-2">
            <input
              id={`day-${currentIndex}-new-act`}
              type="text"
              value={newActivity[currentIndex] || ""}
              onChange={(e) =>
                setNewActivity({
                  ...newActivity,
                  [currentIndex]: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddActivity(currentIndex);
                }
              }}
              placeholder="Type activity (e.g. Shikara Ride on Dal Lake) and press Enter"
              className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={() => handleAddActivity(currentIndex)}
              className="px-3.5 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold transition shadow-2xs"
            >
              Add
            </button>
          </div>

          {/* Quick Preset Activity Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add:
            </span>
            {COMMON_ACTIVITY_PRESETS.slice(0, 5).map((preset) => {
              const alreadyAdded = currentDay.activities?.includes(preset);
              if (alreadyAdded) return null;

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddActivity(currentIndex, preset)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/60 transition"
                >
                  + {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* FIX 4.2: CONSOLIDATED PHOTO PICKER (1 clean action, no search query input) */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Day Photo Banner (Unsplash / Pexels)</span>
          </label>

          {currentDay.image ? (
            /* Selected Photo Preview Card: 1 Change Button + 1 Remove Button */
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={currentDay.image.imageUrl}
                  alt={
                    currentDay.image.photographerName
                      ? `Photo by ${currentDay.image.photographerName}`
                      : "Day photo preview"
                  }
                  className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-200 shadow-2xs"
                />
                <div className="text-xs truncate">
                  <div className="font-bold text-slate-800 truncate">
                    Photo by {currentDay.image.photographerName || "Verified Photographer"}
                  </div>
                  <div className="text-slate-400 text-[10px] flex items-center gap-1.5 mt-0.5">
                    <span className="uppercase font-bold text-slate-600 bg-slate-200/70 px-1 py-0.2 rounded text-[9px]">
                      {currentDay.image.provider}
                    </span>
                    <span>• High Resolution Banner</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition shadow-2xs"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDay(currentIndex, { image: null })}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty State: 1 Single Primary Action: [ Choose Photo ] */
            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">
                    No Photo Selected for Day {currentDay.dayNumber}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Curate a high-resolution banner photo for the proposal page.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="px-3.5 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Choose Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        dayNumber={currentDay.dayNumber}
        mode="day"
        initialQuery={currentDay.imageQuery || currentDay.title}
        destinationFallback={currentDay.stay?.city || ""}
        currentImage={currentDay.image}
        onSelectImage={(img) => handleUpdateDay(currentIndex, { image: img })}
      />
    </div>
  );
}
