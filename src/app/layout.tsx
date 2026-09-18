import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PollarRoot } from "@/components/pollar/PollarRoot";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { pollarApiKey, pollarMode } from "@/lib/mode";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AfriPollar Agent Corridor",
  description:
    "Fund transfers through African local rails or a verified agent, settle through Pollar on Stellar in USDC, and prepare payout into Bolivia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const mode = pollarMode();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AmbientBackground />
        <PollarRoot apiKey={pollarApiKey()} mode={mode}>
          <SiteHeader mode={mode === "live" ? "live" : "sandbox"} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </PollarRoot>
      </body>
    </html>
  );
}
