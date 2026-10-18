import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import { storefrontProducts, categories } from "@/lib/queries";
import { STORE_NAME } from "@/lib/config";

const SORTS = [
  { key: "popular", label: "Popular" },
  { key: "latest", label: "Latest" },
  { key: "topsales", label: "Top Sales" },
  { key: "price", label: "Price" },
];

function qs(category: string | null, sort: string): string {
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (sort && sort !== "popular") p.set("sort", sort);
  const s = p.toString();
  return s ? `/?${s}#catalog` : `/#catalog`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category ?? null;
  const sort = sp.sort ?? "popular";
  const [products, cats] = await Promise.all([
    storefrontProducts({ category, sort }),
    categories(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-14 sm:pb-20 sm:pt-20">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Custom print studio</p>
          <h1 className="font-display mt-7 max-w-4xl text-[clamp(2.25rem,6.5vw,5.5rem)] leading-[1.12]">
            Boxes, stickers &amp; <span className="mark-accent">keepsakes</span> made yours.
          </h1>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-lg text-[var(--muted)]">
              Print-to-order packaging for makers, bakers, and gift-givers. Choose your color,
              size, and personalized text — we handle the rest.
            </p>
            <div className="flex shrink-0 gap-3">
              <Link
                href="#catalog"
                className="bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              >
                Shop the catalog
              </Link>
              <Link
                href="/orders"
                className="border-2 px-6 py-3 text-sm font-semibold transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                style={{ borderColor: "var(--foreground)" }}
              >
                Track order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop: category sidebar + sort + grid */}
      <section id="catalog" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[190px_1fr]">
          {/* Category sidebar (desktop) */}
          <aside className="hidden md:block">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Category
            </h2>
            <nav className="flex flex-col">
              <CatLink href={qs(null, sort)} active={!category} label="All Products" />
              {cats.map((c) => (
                <CatLink
                  key={c.category}
                  href={qs(c.category, sort)}
                  active={category === c.category}
                  label={c.category}
                />
              ))}
            </nav>
          </aside>

          <div>
            {/* Category chips (mobile) */}
            <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
              <Chip href={qs(null, sort)} active={!category} label="All" />
              {cats.map((c) => (
                <Chip key={c.category} href={qs(c.category, sort)} active={category === c.category} label={c.category} />
              ))}
            </div>

            {/* Sort bar */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-[var(--muted)]">Sort by</span>
              {SORTS.map((s) => {
                const active = sort === s.key;
                return (
                  <Link
                    key={s.key}
                    href={qs(category, s.key)}
                    className={`border px-4 py-1.5 text-sm transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--on-accent)]"
                        : "hover:border-[var(--foreground)]"
                    }`}
                    style={active ? undefined : { borderColor: "var(--line)" }}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>

            {products.length === 0 ? (
              <p className="py-16 text-center text-[var(--muted)]">No products in this category yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Buyer reviews — social proof before the CTA */}
      <Testimonials />

      {/* Closing band — signature yellow */}
      <section className="bg-[var(--accent)] text-[var(--on-accent)]">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <p className="font-display text-3xl sm:text-4xl">Have a custom run in mind?</p>
          <p className="mx-auto mt-3 max-w-md text-[var(--on-accent)]/75">
            Tell us your idea — colors, sizes, quantities, and artwork. {STORE_NAME} prints it.
          </p>
          <a
            href="https://m.me/oppaprints"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-[#FFF6E0] transition hover:bg-[#FFF6E0] hover:text-[#1A1A1A]"
          >
            Message us on Messenger
          </a>
        </div>
      </section>
    </div>
  );
}

function CatLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`border-l-4 py-2 pl-3 text-sm transition ${
        active
          ? "border-[var(--accent)] font-semibold text-[var(--accent-ink)]"
          : "border-transparent text-[var(--foreground)] hover:text-[var(--accent-ink)]"
      }`}
    >
      {label}
    </Link>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap border px-3 py-1.5 text-sm ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--on-accent)]"
          : ""
      }`}
      style={active ? undefined : { borderColor: "var(--line)" }}
    >
      {label}
    </Link>
  );
}
