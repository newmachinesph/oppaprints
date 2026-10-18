"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { STORE_NAME } from "@/lib/config";

const LINKS = [
  { href: "/", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/orders", label: "Track order" },
];

export default function Nav() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Admin has its own chrome.
  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{
        borderColor: "var(--line)",
        background: "color-mix(in oklab, var(--background) 82%, transparent)",
      }}
    >
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/op-logos.avif"
            alt={STORE_NAME}
            className="h-14 w-auto object-contain sm:h-16"
          />
        </Link>

        {/* Desktop links */}
        <div className="ml-auto hidden items-center gap-5 text-sm md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                isActive(l.href)
                  ? "font-medium text-black dark:text-white"
                  : "text-[var(--muted)] hover:text-[var(--accent-ink)]"
              }
            >
              {l.label}
            </Link>
          ))}
          <CartLink count={count} />
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="ml-auto flex items-center gap-1.5 md:hidden">
          <CartLink count={count} />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center border border-black/15 dark:border-white/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="border-t border-black/10 md:hidden dark:border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`border-b border-black/5 py-3 text-sm last:border-0 dark:border-white/5 ${
                  isActive(l.href)
                    ? "font-medium text-black dark:text-white"
                    : "text-black/70 dark:text-white/70"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={`Cart${count > 0 ? ` (${count})` : ""}`}
      className="relative flex h-9 w-9 items-center justify-center border transition hover:bg-[var(--accent)] hover:text-[var(--on-accent)]"
      style={{ borderColor: "var(--line)" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.5l1.6 10.2a1.5 1.5 0 0 0 1.48 1.26h9.34a1.5 1.5 0 0 0 1.47-1.2l1.36-6.76H5.1M9 20a1 1 0 1 0 0 .01M17 20a1 1 0 1 0 0 .01"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-[var(--accent)] px-1 text-[11px] font-semibold leading-none text-[var(--on-accent)]">
          {count}
        </span>
      )}
    </Link>
  );
}
