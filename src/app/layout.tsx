import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrippyGo — B2B Travel Itinerary Engine",
  description: "Convert supplier quotes into branded, client-ready luxury travel itineraries with zero supplier leaks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
