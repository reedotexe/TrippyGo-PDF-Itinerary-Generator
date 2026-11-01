"use client";

import React from "react";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { agencyDefaults } from "@/config/agency";
import { TRIPPYGO_LOGO_DATA_URI } from "./brand-assets";
import { PageWatermark, PageFooter } from "./PageHeaderFooter";
import { Star, Building2 } from "lucide-react";

interface BackPageProps {
  clientView: ClientItineraryView;
  pageNumber?: number;
  totalPages?: number;
}

export default function BackPage({ clientView, pageNumber, totalPages }: BackPageProps) {
  const { pdf } = agencyDefaults;
  const { companyDetails, socialProof } = pdf;

  // Curated high-res traveler moments for 2x2 masonry grid
  const mosaicPhotos = [
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80", // Bali couple retreat
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80", // Tropical coastline
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80", // Vietnam bridge/arch
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80", // Santorini cliffside
  ];

  return (
    <section className="back-page itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break bg-white text-slate-800 font-body">
      <PageWatermark />
      <div className="relative z-10 space-y-6">
        {/* Top Split Section: Curator Note (Left 7 cols) + Photo Mosaic & Proof (Right 5 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Brand Story, Founder's Philosophy & Signature */}
          <div className="md:col-span-7 space-y-5">
            {/* Vector Brand Logo */}
            <div className="w-44 h-auto">
              <img
                src="/brand/trippygo-logo.png"
                alt="TrippyGo by Friends Travels"
                className="w-full h-auto object-contain"
                onError={(e) => {
                  if (TRIPPYGO_LOGO_DATA_URI && e.currentTarget.src !== TRIPPYGO_LOGO_DATA_URI) {
                    e.currentTarget.src = TRIPPYGO_LOGO_DATA_URI;
                  }
                }}
              />
            </div>

            {/* Editorial Headline */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c92229] block mb-1">
                A Note From Our Curators
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#091c3e] font-serif-luxury tracking-tight leading-tight">
                Crafted with Passion.
                <span className="block text-2xl md:text-3xl font-serif-luxury font-normal italic text-[#c92229] mt-0.5">
                  For journeys you'll always remember.
                </span>
              </h2>
            </div>

            {/* Narrative Editorial Letter */}
            <div className="space-y-2.5 text-xs md:text-sm text-slate-600 leading-relaxed font-body">
              <p>
                We believe an unforgettable journey begins long before your departure date. For over 18 years, our travel specialists have shaped tailor-made itineraries into seamless, joyous realities.
              </p>
              <p>
                Whether it is selecting the perfect heritage villa, securing priority access to iconic landmarks, or synchronizing seamless private transfers, every element of this proposal was curated with devotion.
              </p>
              <p>
                Thank you for entrusting TrippyGo with your travel memories. We look forward to welcoming you on an extraordinary journey.
              </p>
            </div>

            {/* Clean Editorial Sign-off (Replaces casual cursive with luxury serif) */}
            <div className="pt-2">
              <div className="font-serif-luxury text-2xl font-bold tracking-tight text-[#091c3e]">
                <span className="text-[#c92229]">Trippy</span>
                <span className="text-[#1556a6]">Go</span>
                <span className="text-xs font-semibold text-slate-500 ml-2 font-body tracking-normal uppercase">
                  by Friends Travels
                </span>
              </div>
              <div className="text-[9.5px] uppercase font-bold tracking-[0.2em] text-[#c92229] mt-0.5 font-body">
                Curators & Private Travel Specialists
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): 2x2 Photo Mosaic + Social Proof + Branches */}
          <div className="md:col-span-5 space-y-3.5">
            {/* 2x2 Photo Grid */}
            <div className="grid grid-cols-2 gap-2">
              {mosaicPhotos.map((url, i) => (
                <div key={i} className="h-28 md:h-32 rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100">
                  <img
                    src={url}
                    alt={`Traveler Memory ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              ))}
            </div>

            {/* Google Rating 5/5 Card */}
            <div className="p-3 rounded-lg border border-slate-200/90 bg-[#fafaf7] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#091c3e]">
                  Google Rating
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">5.0 / 5.0</span>
                  <div className="flex text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <Star className="w-3 h-3 fill-amber-500" />
                    <Star className="w-3 h-3 fill-amber-500" />
                    <Star className="w-3 h-3 fill-amber-500" />
                    <Star className="w-3 h-3 fill-amber-500" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1 flex items-center justify-between">
                <span>Verified Traveler Score</span>
                <span className="font-semibold text-slate-700">100% Authentic Reviews</span>
              </div>
            </div>

            {/* Branches Card */}
            <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-[9.5px] uppercase font-bold tracking-[0.18em] text-[#091c3e]">
                <Building2 className="w-3.5 h-3.5 text-[#1556a6]" />
                <span>Our Branch Network</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {companyDetails.branches?.map((branch, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Luxury Architectural Footer */}
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  );
}
