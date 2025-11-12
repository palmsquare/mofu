import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadMagnet Studio – Crée et partage ton lead magnet en 2 minutes",
  description:
    "Uploade ton guide, personnalise ta page de capture et partage ton lead magnet sans site ni CRM. Pensé pour freelances, coachs et créateurs.",
  metadataBase: new URL("https://leadmagnet.studio"),
  openGraph: {
    title: "LeadMagnet Studio",
    description: "Lead magnets sans friction pour freelances, coachs et créateurs.",
    url: "https://leadmagnet.studio",
    siteName: "LeadMagnet Studio",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadMagnet Studio",
    description: "Crée un lead magnet en 2 minutes, sans site ni CRM.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
