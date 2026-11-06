import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-app-inter",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "TrippyGo — B2B Travel Itinerary Engine",
  description: "Convert supplier quotes into branded, client-ready luxury travel itineraries with zero supplier leaks.",
};

import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(inter.variable)}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
