import React from "react";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { agencyDefaults } from "@/config/agency";
import {
  Globe2,
  Users,
  Luggage,
  Heart,
  Trophy,
  Star,
  ShieldCheck,
  Headphones,
  Award,
  Lock,
  Phone,
  Mail,
  Globe,
  Plane,
} from "lucide-react";

interface BackPageProps {
  clientView: ClientItineraryView;
  pageNumber?: number;
}

export default function BackPage({ clientView }: BackPageProps) {
  const { pdf, brand } = agencyDefaults;
  const { companyDetails, socialProof } = pdf;

  // Curated real traveler photos for 2x3 photo mosaic
  const mosaicPhotos = [
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80", // Bali nest / couple
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80", // Tropical beach
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80", // Scenic boat trip
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&q=80", // Vietnam bridge/arch
    "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=400&q=80", // Couple sunset
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80", // Santorini / town
  ];

  return (
    <footer className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break bg-white text-slate-800">
      <div className="space-y-6">
        {/* Top Split Section: Brand Story (Left) + Photo Mosaic (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Logo, Calligraphy, Values */}
          <div className="md:col-span-7 space-y-5">
            {/* Logo & Airplane Trail */}
            <div className="flex items-center justify-between">
              <div className="w-36 h-auto">
                <img
                  src="/brand/trippygo-logo.png"
                  alt="TrippyGo"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <span className="w-12 border-t-2 border-dashed border-slate-300" />
                <Plane className="w-5 h-5 text-amber-500 rotate-45" />
              </div>
            </div>

            {/* Emotional Typography */}
            <div>
              <div className="text-4xl md:text-5xl font-script text-[#c92229] leading-tight font-bold">
                Thank you
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-[#091c3e] tracking-tight font-display uppercase mt-0.5">
                for choosing
              </div>
              <div className="text-3xl md:text-4xl font-black text-[#c92229] tracking-wide font-display uppercase">
                TrippyGo <span className="text-xs font-semibold text-slate-500 tracking-normal block -mt-1 font-sans">by Friends Travel</span>
              </div>
            </div>

            {/* 4 Brand Pillars with Icon Bullets */}
            <div className="space-y-3.5 pt-2 text-xs md:text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                  <Globe2 className="w-3.5 h-3.5" />
                </div>
                <p className="leading-relaxed">
                  We believe every unforgettable journey begins long before the departure date. We turn travel dreams into effortless realities.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <p className="leading-relaxed">
                  With over 8 years of expertise, we have crafted tailored holidays for thousands of families, couples, and solo explorers worldwide.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-red-50 text-[#c92229] flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
                  <Luggage className="w-3.5 h-3.5" />
                </div>
                <p className="leading-relaxed">
                  We handle every flight, boutique stay, transfer, and excursion so you can immerse fully in the joy of discovering the world.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
                  <Heart className="w-3.5 h-3.5" />
                </div>
                <p className="leading-relaxed">
                  For us, travel is about cherished memories, laughter shared, and stories brought home to treasure for a lifetime.
                </p>
              </div>
            </div>

            {/* Dark Navy Mini Banner */}
            <div className="bg-[#091c3e] text-white rounded-xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block font-display">
                  Our Promise
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block font-display">
                  For journeys you'll always remember.
                </span>
              </div>
              <Plane className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          {/* Right Column (5 cols): 2x3 Photo Mosaic + Social Proof */}
          <div className="md:col-span-5 space-y-4">
            {/* 2x3 Photo Grid */}
            <div className="grid grid-cols-2 gap-2">
              {mosaicPhotos.map((url, i) => (
                <div key={i} className="h-28 rounded-xl overflow-hidden shadow-xs border border-slate-200/60">
                  <img
                    src={url}
                    alt={`Happy Traveler ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              ))}
            </div>

            {/* Award Banner */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider block">
                  Awarded Excellence
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight block">
                  {socialProof.awardTitle}
                </span>
              </div>
            </div>

            {/* Social Ratings Badges */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="flex items-center justify-center gap-1 font-bold text-slate-900 font-display">
                  <span>{socialProof.googleRating}</span>
                  <div className="flex text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {socialProof.googleReviewsCount}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <div className="font-extrabold text-slate-900 text-sm font-display">
                  {socialProof.instagramFollowers}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Community Followers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Trust Pillars Card matching Reference Page 17 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm avoid-break">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1556a6] mx-auto flex items-center justify-center mb-1.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-display">
                Trusted by 100k+
              </div>
              <div className="text-[10px] text-slate-400">
                from across the world
              </div>
            </div>

            <div className="p-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1556a6] mx-auto flex items-center justify-center mb-1.5">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-display">
                24/7 Support
              </div>
              <div className="text-[10px] text-slate-400">
                whenever you need us
              </div>
            </div>

            <div className="p-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1556a6] mx-auto flex items-center justify-center mb-1.5">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-display">
                Hassle-free
              </div>
              <div className="text-[10px] text-slate-400">
                end-to-end planning
              </div>
            </div>

            <div className="p-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1556a6] mx-auto flex items-center justify-center mb-1.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-display">
                Safe & Secure
              </div>
              <div className="text-[10px] text-slate-400">
                data & trip protection
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 p-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1556a6] mx-auto flex items-center justify-center mb-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xs font-bold text-slate-900 font-display">
                Personalized
              </div>
              <div className="text-[10px] text-slate-400">
                designed just for you
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Bleed Branded Contact Banner matching Reference Page 17 Footer */}
      <div className="mt-6 -mx-6 md:-mx-10 -mb-6 md:-mb-10 bg-[#091c3e] text-white p-5 md:px-10 border-t-4 border-amber-400 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span>{companyDetails.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span>{companyDetails.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <span>{companyDetails.website.replace("https://", "")}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <span>TrippyGo Holidays LLP</span>
          <Plane className="w-4 h-4 text-amber-400 ml-1" />
        </div>
      </div>
    </footer>
  );
}
