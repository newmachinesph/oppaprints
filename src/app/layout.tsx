import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import Nav from "@/components/Nav";
import MessengerButton from "@/components/MessengerButton";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/config";

// Brand type: Poppins — Medium (body), SemiBold (headings), Bold (display).
const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SEO_DESCRIPTION =
  "Print-to-order boxes, stickers, and keepsakes for makers, bakers, and gift-givers. Choose your color, size, and personalized text — Oppa Prints handles the rest.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE_NAME} — ${STORE_TAGLINE}`, template: `%s · ${STORE_NAME}` },
  description: SEO_DESCRIPTION,
  // opengraph-image.tsx / icon.svg auto-populate images + icons.
  openGraph: {
    type: "website",
    siteName: STORE_NAME,
    title: `${STORE_NAME} — ${STORE_TAGLINE}`,
    description: SEO_DESCRIPTION,
    url: SITE_URL,
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE_NAME} — ${STORE_TAGLINE}`,
    description: SEO_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <MessengerButton />
        </CartProvider>
      </body>
    </html>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="font-display text-5xl leading-[0.95] sm:text-7xl">{STORE_NAME}</p>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">{STORE_TAGLINE}</p>
        <div
          className="mt-10 flex flex-col gap-4 border-t pt-6 text-sm sm:flex-row sm:items-center"
          style={{ borderColor: "var(--line)" }}
        >
          <span className="text-[var(--muted)]">
            © {year} {STORE_NAME}
          </span>
          <nav className="flex flex-wrap gap-5 sm:ml-auto">
            <Link href="/about" className="hover:text-[var(--accent-ink)]">About</Link>
            <Link href="/contact" className="hover:text-[var(--accent-ink)]">Contact</Link>
            <Link href="/orders" className="hover:text-[var(--accent-ink)]">Track order</Link>
            <a
              href="https://m.me/oppaprints"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-ink)]"
            >
              Messenger
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
