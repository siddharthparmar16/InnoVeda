import type { Metadata } from "next";
import { Outfit, Cinzel } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { redirect } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  redirect('/landing');
}

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IP-SAKTI Sahayak | Intelligent Ayurveda IP & Statutory Guidance",
  description: "Statutory Intelligence, Prior Art Analysis and Traditional Knowledge Defense",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className="light">
      <body className={`${outfit.variable} ${cinzel.variable}`} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', margin: 0, padding: 0 }}>
        <ThemeProvider>
          <AuthProvider>
            {/* App Shell with Dynamic Route Handling */}
            <AppShell>
              {children}
            </AppShell>

            {/* Global Researcher Authentication Modal */}
            <AuthModal />

            {/* ── Google Translate (hidden widget) ─────────────────────────────────
                The container is invisible; we drive it programmatically via our
                own language selector instead of showing Google's yellow toolbar. */}
            <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden', position: 'absolute', top: '-9999px', left: '-9999px' }} aria-hidden="true" />

          </AuthProvider>
        </ThemeProvider>

        {/* Google Translate initialiser — runs after page hydration */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                try {
                  new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,mr,sa',
                    autoDisplay: false,
                    gaTrack: false,
                  }, 'google_translate_element');
                } catch(e) {
                  console.warn('[GT] Init error:', e);
                }
              }
            `,
          }}
        />
        <Script
          id="google-translate-script"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
