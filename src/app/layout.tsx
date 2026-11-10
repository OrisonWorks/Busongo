import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HideOnEmbed from "@/components/HideOnEmbed";
import { brand } from "@/config/brand";
import { getUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { A11Y_BOOT } from "@/components/A11yMenu";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s | ${brand.name}` },
  description: brand.description,
  openGraph: { siteName: brand.name, type: "website", locale: "en_ZM" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport = { themeColor: "#070b14" };

const SW_REGISTER = `if("serviceWorker"in navigator&&window.top===window)addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, lang] = await Promise.all([getUser(), getLocale()]);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT }} />
        {process.env.NODE_ENV === "production" && <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />}
      </head>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <HideOnEmbed><a href="#main" className="skip-link">Skip to main content</a></HideOnEmbed>
        <HideOnEmbed><Navbar user={user ? { name: user.name, email: user.email, plan: user.plan, role: user.role } : null} lang={lang} /></HideOnEmbed>
        <main id="main" tabIndex={-1}>{children}</main>
        <HideOnEmbed><Footer /></HideOnEmbed>
      </body>
    </html>
  );
}
