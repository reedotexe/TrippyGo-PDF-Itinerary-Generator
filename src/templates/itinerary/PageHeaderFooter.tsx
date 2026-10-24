import React from "react";
import { agencyDefaults } from "@/config/agency";

interface PageFooterProps {
  pageNumber?: number;
  totalPages?: number;
}

export function PageFooter({ pageNumber }: PageFooterProps) {
  return (
    <footer className="mt-8 pt-2 border-t-2 border-amber-500/80 flex items-center justify-between text-[11px] text-slate-500 font-sans avoid-break">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
        <span className="text-red-600 font-bold">TrippyGo</span>
        <span className="text-slate-400 font-normal">by Friends Travel</span>
      </div>
      {pageNumber && (
        <div className="font-medium text-slate-600">
          Page {pageNumber}
        </div>
      )}
    </footer>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="text-center mb-6 avoid-break">
      <h2 className="text-2xl md:text-3xl font-extrabold text-[#091c3e] tracking-tight font-display">
        {title}
      </h2>
      <div className="w-12 h-1 bg-[#c92229] mx-auto mt-2 rounded-full" />
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 font-medium max-w-md mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
