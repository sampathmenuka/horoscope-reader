import type { Metadata, Viewport } from "next";
import { Noto_Sans_Sinhala, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { BottomNav } from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";
import { isLang, LOCALE_COOKIE } from "@/lib/i18n";
import "./globals.css";

const sinhala = Noto_Sans_Sinhala({
  variable: "--nf-sinhala",
  // Latin text uses Plus Jakarta Sans, so only the Sinhala subset is preloaded.
  subsets: ["sinhala"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--nf-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Handahana · හඳහන",
  description: "Sri Lankan horoscope (Handahana / Kendaraya) with sidereal Lahiri calculations, Vimshottari Maha Dasha and a personal reading in Sinhala or English.",
};

// The language comes from the NEXT_LOCALE cookie, so the shell renders per request.
export const instant = false;

export const viewport: Viewport = {
  themeColor: "#0b0a1f",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieLang = (await cookies()).get(LOCALE_COOKIE)?.value;
  const initialLang = isLang(cookieLang) ? cookieLang : null;

  return (
    <html lang={initialLang ?? "si"} className={`${sinhala.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="relative min-h-full bg-cosmic-950 text-indigo-50">
        <div className="page-backdrop pointer-events-none fixed inset-0 -z-10 no-print" aria-hidden>
          <div className="star-field absolute inset-0" />
        </div>
        <LanguageProvider initialLang={initialLang}>
          <Navbar />
          {children}
          {/* Keeps the last content clear of the fixed bottom bar on phones. */}
          <div aria-hidden className="no-print h-24 md:hidden" />
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
