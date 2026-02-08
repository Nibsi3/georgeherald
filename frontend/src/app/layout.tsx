import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#DC2626",
};

export const metadata: Metadata = {
  title: {
    default: "George Herald | Garden Route News",
    template: "%s | George Herald",
  },
  description:
    "Your trusted source for local news, sport, and community stories from George and the Garden Route.",
  keywords: ["George Herald", "Garden Route", "News", "George", "South Africa", "Local News"],
  icons: {
    apple: "/georgeherald_favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://www.georgeherald.com",
    siteName: "George Herald",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://cms.groupeditors.com" />
        <link rel="preconnect" href="https://cms.groupeditors.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pub-34cf5c8e66714aeb885f7cd9a7146cac.r2.dev" />
        <link rel="preconnect" href="https://pub-34cf5c8e66714aeb885f7cd9a7146cac.r2.dev" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
