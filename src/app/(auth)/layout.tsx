import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafaf7] flex flex-col justify-between text-[#091c3e] selection:bg-[#c92229] selection:text-white">
      {/* Editorial Top Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md py-4 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#091c3e] flex items-center justify-center font-serif font-black text-lg text-white shadow-sm ring-1 ring-black/5 group-hover:bg-[#1556a6] transition">
            T
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight text-[#091c3e] block leading-none">
              TrippyGo
            </span>
            <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-slate-500 block mt-0.5">
              Operations Workbench
            </span>
          </div>
        </Link>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          B2B Itinerary & Proposal Engine
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500 font-sans">
        &copy; 2026 TrippyGo Travel Agency. Authorized Agency Personnel Only.
      </footer>
    </div>
  );
}
