import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { FloatingNav } from "@/components/floating-nav";

const fraunces = localFont({
  src: "../public/fonts/fraunces.woff2",
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Source Serif 4", "Georgia", "serif"],
});

const inter = localFont({
  src: "../public/fonts/inter.woff2",
  variable: "--font-inter",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Groundtruth: Neutral Reference Layer for India's GCCs",
  description:
    "An evidence-backed, neutral reference layer, census, and market intelligence platform for Global Capability Centres (GCCs) in India.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F8F6] text-[#111A15] antialiased selection:bg-[#D0F07A] selection:text-[#072A1B]">
        {/* Floating Pill Nav */}
        <FloatingNav />

        {/* Main Application Content */}
        <main className="flex-1 w-full">{children}</main>

        {/* Global Footer */}
        <footer className="w-full border-t border-[#E2E8E4] py-8 text-center bg-[#F6F8F6]">
          <div className="mx-auto max-w-6xl px-4 text-xs text-[#8FA89A] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#14503A]"></span>
              <span>Groundtruth • India GCC Reference Layer</span>
            </div>
            <div>A prototype built for an assignment • Data as of March 2026</div>
            <div className="flex items-center gap-4 text-[#2C3D34]">
              <Link href="/" className="hover:text-[#072A1B] underline">Census</Link>
              <Link href="/map" className="hover:text-[#072A1B] underline">The Map</Link>
              <Link href="/brief" className="hover:text-[#072A1B] underline">The Compass</Link>
              <Link href="/board" className="hover:text-[#072A1B] underline">The Board</Link>
              <Link href="/sources" className="hover:text-[#072A1B] underline">Sources</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
