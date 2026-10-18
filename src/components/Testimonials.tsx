import { testimonials } from "@/lib/testimonials";

function Stars() {
  return (
    <span
      className="text-sm leading-none text-[var(--accent)]"
      aria-label="Rated 5 out of 5 stars"
    >
      ★★★★★
    </span>
  );
}

export default function Testimonials() {
  return (
    <section
      aria-labelledby="reviews-heading"
      className="border-t"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="mb-10 flex flex-col gap-3 sm:mb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Straight from our Shopee buyers
          </p>
          <h2
            id="reviews-heading"
            className="font-display max-w-2xl text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.12]"
          >
            Real orders, <span className="mark-accent">real reactions</span>.
          </h2>
        </div>

        {/* CSS columns = magazine masonry: uneven quote lengths pack without JS. */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <figure
              key={t.handle}
              className="mb-4 flex break-inside-avoid flex-col gap-3 border p-5 transition hover:border-[var(--foreground)]"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <figcaption className="font-mono text-[13px]">{t.handle}</figcaption>
                <Stars />
              </div>
              <blockquote className="text-[15px] leading-relaxed">{t.quote}</blockquote>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {t.product}
              </p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
