"use client";

import React, { useState } from "react";
import { ItineraryDay } from "@/lib/schema/itinerary";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Plus,
  AlertCircle,
  Image as ImageIcon,
  Check,
} from "lucide-react";

import ImagePickerModal from "./ImagePickerModal";

interface DaysPanelProps {
  days: ItineraryDay[];
  onChange: (updatedDays: ItineraryDay[]) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

export default function DaysPanel({ days, onChange, reviewFlags = [] }: DaysPanelProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [newActivity, setNewActivity] = useState<Record<number, string>>({});
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

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
      imageQuery: "Scenic landscape",
      image: null,
    };
    onChange([...days, newDay]);
    setActiveTab(newDayNum);
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

  const handleUpdateDay = (index: number, updatedFields: Partial<ItineraryDay>) => {
    const updated = days.map((d, i) => (i === index ? { ...d, ...updatedFields } : d));
    onChange(updated);
  };

  const handleToggleMeal = (dayIndex: number, meal: string) => {
    const currentMeals = days[dayIndex].meals || [];
    const newMeals = currentMeals.includes(meal)
      ? currentMeals.filter((m) => m !== meal)
      : [...currentMeals, meal];
    handleUpdateDay(dayIndex, { meals: newMeals });
  };

  const handleAddActivity = (dayIndex: number) => {
    const text = (newActivity[dayIndex] || "").trim();
    if (!text) return;
    const currentActs = days[dayIndex].activities || [];
    handleUpdateDay(dayIndex, { activities: [...currentActs, text] });
    setNewActivity({ ...newActivity, [dayIndex]: "" });
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    const currentActs = days[dayIndex].activities || [];
    handleUpdateDay(dayIndex, {
      activities: currentActs.filter((_, i) => i !== actIndex),
    });
  };

  const currentDay = days[activeTab - 1] || days[0];
  const currentIndex = activeTab - 1;

  if (!currentDay) return null;

  const titleFlag = getFlag(currentIndex, "title");
  const descFlag = getFlag(currentIndex, "description");
  const hotelFlag = getFlag(currentIndex, "stay.hotel");

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>🗺️</span> Day-by-Day Itinerary ({days.length} Days)
        </h3>
        <button
          type="button"
          onClick={handleAddDay}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Day
        </button>
      </div>

      {/* Day Selector Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {days.map((day, i) => {
          const hasFlag = reviewFlags.some((f) => f.field.startsWith(`days.${i}`));
          const isActive = activeTab === day.dayNumber;

          return (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => setActiveTab(day.dayNumber)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              } ${hasFlag ? "ring-2 ring-amber-400" : ""}`}
            >
              <span>Day {day.dayNumber}</span>
              {hasFlag && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Card */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-5">
        {/* Day Actions Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {currentDay.dayNumber}
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Editing Day {currentDay.dayNumber} of {days.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => handleMove(currentIndex, "up")}
              title="Move day earlier"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentIndex === days.length - 1}
              onClick={() => handleMove(currentIndex, "down")}
              title="Move day later"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDuplicateDay(currentIndex)}
              title="Duplicate day"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteDay(currentIndex)}
              title="Delete day"
              className="p-1.5 rounded hover:bg-red-100 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Day Title *
          </label>
          <input
            type="text"
            value={currentDay.title}
            onChange={(e) => handleUpdateDay(currentIndex, { title: e.target.value })}
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
              titleFlag
                ? "border-amber-400 bg-amber-50/40 focus:ring-amber-400"
                : "border-slate-300 focus:ring-blue-200"
            }`}
            placeholder="e.g. Arrival in Srinagar & Dal Lake Sunset"
          />
          {titleFlag && (
            <div className="mt-1 text-xs text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {titleFlag.issue}
            </div>
          )}
        </div>

        {/* Day Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Day Description & Schedule
          </label>
          <textarea
            rows={3}
            value={currentDay.description}
            onChange={(e) => handleUpdateDay(currentIndex, { description: e.target.value })}
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 leading-relaxed ${
              descFlag
                ? "border-amber-400 bg-amber-50/40 focus:ring-amber-400"
                : "border-slate-300 focus:ring-blue-200"
            }`}
            placeholder="Detailed narrative for the day..."
          />
          {descFlag && (
            <div className="mt-1 text-xs text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {descFlag.issue}
            </div>
          )}
        </div>

        {/* Stay & Hotel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Stay / Hotel</label>
            <input
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
              className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                hotelFlag ? "border-amber-400 bg-amber-50/40" : "border-slate-300"
              }`}
            />
            {hotelFlag && (
              <span className="text-[10px] text-amber-700">{hotelFlag.issue}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
            <input
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
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
          </div>
        </div>

        {/* Meals Included */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
            Meals Included
          </label>
          <div className="flex gap-4">
            {["Breakfast", "Lunch", "Dinner"].map((meal) => {
              const isChecked = currentDay.meals?.includes(meal);
              return (
                <label key={meal} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleMeal(currentIndex, meal)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{meal}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Activities Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
            Activities / Highlights
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentDay.activities?.map((act, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-white text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded text-xs"
              >
                <span>{act}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveActivity(currentIndex, i)}
                  className="text-slate-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newActivity[currentIndex] || ""}
              onChange={(e) =>
                setNewActivity({ ...newActivity, [currentIndex]: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddActivity(currentIndex);
                }
              }}
              placeholder="Add activity (e.g. Shikara Ride) and press Enter"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="button"
              onClick={() => handleAddActivity(currentIndex)}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
            >
              Add
            </button>
          </div>
        </div>

        {/* Image Query & Photo Attachment */}
        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              Day Photo (Unsplash / Pexels)
            </label>
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3" />
              {currentDay.image ? "Change Photo" : "Search & Select Photo"}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={currentDay.imageQuery}
              onChange={(e) => handleUpdateDay(currentIndex, { imageQuery: e.target.value })}
              placeholder="e.g. Dal Lake Srinagar shikara"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700"
            >
              Find Photos
            </button>
          </div>

          {currentDay.image ? (
            <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={currentDay.image.imageUrl}
                  alt="thumbnail"
                  className="w-12 h-12 object-cover rounded-lg shrink-0"
                />
                <div className="text-xs truncate">
                  <div className="font-semibold text-slate-800 truncate">
                    Photo by {currentDay.image.photographerName}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Sourced from <span className="uppercase font-bold text-slate-600">{currentDay.image.provider}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDay(currentIndex, { image: null })}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsPickerOpen(true)}
              className="mt-2 border border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition"
            >
              <span className="text-xs text-slate-500">
                No photo selected for Day {currentDay.dayNumber}. Click to browse high-res photos.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        dayNumber={currentDay.dayNumber}
        initialQuery={currentDay.imageQuery || currentDay.title}
        currentImage={currentDay.image}
        onSelectImage={(img) => handleUpdateDay(currentIndex, { image: img })}
      />
    </div>
  );
}
