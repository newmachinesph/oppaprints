import Link from "next/link";
import { formatCents } from "@/lib/money";
import { imageUrl } from "@/lib/config";
import type { ProductCardData } from "@/lib/queries";

export default function ProductCard({
  product,
  index = 0,
}: {
  product: ProductCardData;
  index?: number;
}) {
  const soldOut = product.total_stock <= 0;
  const delay = Math.min(index * 45, 400);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="op-reveal group flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="relative aspect-square overflow-hidden border"
        style={{ borderColor: "var(--line)" }}
      >
        {product.primary_key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(product.primary_key)}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${
              soldOut ? "opacity-70 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-black/[0.03] dark:bg-white/[0.03]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/op-logos.avif" alt="" className="h-14 w-14 opacity-30" />
          </div>
        )}

        <span className="absolute left-0 top-0 bg-[var(--background)] px-2 py-1 font-mono text-[11px] text-[var(--muted)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        {soldOut && (
          <span className="absolute right-0 top-0 bg-[var(--foreground)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[var(--background)]">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug transition group-hover:text-[var(--accent-ink)]">
          {product.name}
        </h3>
        <p className="shrink-0 text-[15px] font-semibold tabular-nums">
          {formatCents(product.price_cents)}
        </p>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {product.group_names ? `from · ${product.group_names}` : "single option"}
      </p>
    </Link>
  );
}
