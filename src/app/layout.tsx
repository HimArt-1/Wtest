import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import { FloatingJoinButton } from "@/components/ui/FloatingJoinButton";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "منصة وشّى | WUSHA",
  description: "منصة فنية رقمية تجمع المبدعين العرب. معرض، بورتفوليو، متجر، ونظام قبول ذكي.",
  keywords: ["فن", "معرض", "رقمي", "عربي", "بورتفوليو", "متجر فني"],
  authors: [{ name: "WUSHA" }],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "منصة وشّى | WUSHA",
    description: "منصة فنية رقمية تجمع المبدعين العرب",
    type: "website",
    locale: "ar_SA",
  },
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#ceae7f",
    colorText: "#f0ebe3",
    colorBackground: "#111111",
    colorInputBackground: "#1a1a1a",
    colorInputText: "#f0ebe3",
    fontFamily: "var(--font-arabic), 'IBM Plex Sans Arabic', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "shadow-2xl border border-gold/10 bg-[#111111]",
    formButtonPrimary:
      "bg-gradient-to-r from-[#ceae7f] to-[#b8964f] hover:shadow-[0_0_30px_rgba(206,174,127,0.3)] text-[#0a0a0a] font-bold transition-all duration-500",
    footerActionLink: "text-[#ceae7f] hover:text-[#e0c99a]",
    headerTitle: "font-bold text-[#f0ebe3]",
    headerSubtitle: "text-[#f0ebe3]/60",
    formFieldInput: "bg-[#1a1a1a] border-[#ceae7f]/10 text-[#f0ebe3]",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={arSA} appearance={clerkAppearance} dynamic>
      <html lang="ar" dir="rtl">
        <body className="font-arabic bg-[#080808] text-[#f0ebe3]">
          {/* Noise Texture Overlay */}
          <div className="noise-overlay" aria-hidden="true" />

          {/* Main Content */}
          {children}

          {/* Floating Join Button */}
          <FloatingJoinButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
