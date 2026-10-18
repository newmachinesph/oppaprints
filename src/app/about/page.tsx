import { STORE_NAME, STORE_TAGLINE } from "@/lib/config";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-4xl sm:text-5xl">About {STORE_NAME}</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">{STORE_TAGLINE}</p>
      <div className="mt-6 flex flex-col gap-4 text-black/80 dark:text-white/80">
        <p>
          {STORE_NAME} is a small print studio making custom boxes, packaging, and UV DTF
          stickers for makers, bakers, and gift-givers. Every piece is printed to order —
          choose your color, size, and personalized text, and we handle the rest.
        </p>
        <p>
          We keep things simple: browse, order, pay by GCash or BPI, and send us your receipt.
          No account required. Questions about a custom run or bulk pricing? Message us on
          Facebook any time.
        </p>
      </div>
      <a
        href="https://www.facebook.com/oppaprints"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
      >
        Message us on Facebook
      </a>
    </div>
  );
}
