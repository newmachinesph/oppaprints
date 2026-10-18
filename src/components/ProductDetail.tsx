"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatCents } from "@/lib/money";
import { unitPriceCents } from "@/lib/pricing";
import { COLOR_HEX, imageUrl } from "@/lib/config";
import ShippingRatesTable from "./ShippingRatesTable";
import type { ProductWithDetail, OptionGroup, Variant } from "@/lib/types";

type Selection = Record<number, number>; // group_id -> value_id

export default function ProductDetail({ product }: { product: ProductWithDetail }) {
  const { add } = useCart();
  const groups = product.groups;
  const variants = product.variants;

  // A variant satisfies a partial context (group_id -> value_id).
  const matches = (v: Variant, ctx: Selection) =>
    Object.entries(ctx).every(([gid, vid]) =>
      v.options.some((o) => o.group_id === Number(gid) && o.value_id === vid),
    );

  // Context = chosen values for groups ordered before `group`.
  const earlier = (sel: Selection, group: OptionGroup): Selection => {
    const ctx: Selection = {};
    for (const g of groups) if (g.position < group.position && sel[g.id] != null) ctx[g.id] = sel[g.id];
    return ctx;
  };

  // A value is available if some in-stock variant matches the earlier picks + it.
  const valueAvailable = (sel: Selection, group: OptionGroup, valueId: number) =>
    variants.some((v) => v.stock > 0 && matches(v, { ...earlier(sel, group), [group.id]: valueId }));

  const initial = (): Selection => {
    const sel: Selection = {};
    for (const g of groups) {
      const v = g.values.find((val) => valueAvailable(sel, g, val.id)) ?? g.values[0];
      if (v) sel[g.id] = v.id;
    }
    return sel;
  };

  const [selected, setSelected] = useState<Selection>(initial);
  const [qty, setQty] = useState(1);
  const [gallery, setGallery] = useState(0);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"desc" | "ship">("desc");

  const pick = (group: OptionGroup, valueId: number) =>
    setSelected((prev) => {
      const next: Selection = { ...prev, [group.id]: valueId };
      // Cascade: re-resolve later groups so the path stays valid.
      for (const g of groups) {
        if (g.position <= group.position) continue;
        if (next[g.id] == null || !valueAvailable(next, g, next[g.id])) {
          const v = g.values.find((val) => valueAvailable(next, g, val.id)) ?? g.values[0];
          if (v) next[g.id] = v.id;
        }
      }
      return next;
    });

  const fullySelected = groups.every((g) => selected[g.id] != null);
  const selectedVariant: Variant | null = !groups.length
    ? variants.find((v) => v.options.length === 0) ?? variants[0] ?? null
    : fullySelected
      ? variants.find((v) =>
          groups.every((g) => v.options.some((o) => o.group_id === g.id && o.value_id === selected[g.id])),
        ) ?? null
      : null;

  const stock = selectedVariant?.stock ?? 0;
  const inStock = stock > 0;
  const unit = selectedVariant ? unitPriceCents(product, selectedVariant) : product.price_cents;
  const canAdd = !!selectedVariant && inStock && qty >= 1 && qty <= stock;

  const primaryKey = product.images.find((i) => i.is_primary)?.key ?? product.images[0]?.key ?? null;
  const mainKey = selectedVariant?.image_key ?? product.images[gallery]?.key ?? primaryKey;

  const labelOf = (g: OptionGroup) => g.values.find((v) => v.id === selected[g.id])?.label ?? "";

  const handleAdd = () => {
    if (!selectedVariant || !canAdd) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: selectedVariant.id,
      options: groups.map((g) => ({ group: g.name, value: labelOf(g) })),
      qty,
      unitPriceCents: unit,
      weightGrams: selectedVariant.weight_grams ?? 0,
      imageKey: selectedVariant.image_key ?? primaryKey,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="aspect-square overflow-hidden border" style={{ borderColor: "var(--line)" }}>
          {mainKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(mainKey)} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-black/[0.03] dark:bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/op-logos.avif" alt="" className="h-20 w-20 opacity-30" />
            </div>
          )}
        </div>
        {product.images.length > 1 && !selectedVariant?.image_key && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setGallery(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden border-2 ${
                  i === gallery ? "border-[var(--foreground)]" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(img.key)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div>
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--accent-ink)]">
          ← Back to shop
        </Link>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">{product.name}</h1>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{formatCents(unit)}</p>

        <div className="mt-4">
          <div className="flex gap-1 border-b" style={{ borderColor: "var(--line)" }}>
            <Tab active={tab === "desc"} onClick={() => setTab("desc")}>Description</Tab>
            <Tab active={tab === "ship"} onClick={() => setTab("ship")}>Shipping cost</Tab>
          </div>
          <div className="pt-4">
            {tab === "desc" ? (
              <>
                <Description text={product.description} />
                <p className="mt-4 bg-pink-100 px-3 py-2 text-sm text-black/70 dark:bg-pink-950/30 dark:text-white/80">
                  Note: Prices are VAT-exclusive. For an Official Receipt (O.R.),
                  additional VAT applies to the total.
                </p>
              </>
            ) : (
              <ShippingRatesTable />
            )}
          </div>
        </div>

        {groups.map((g) => {
          const isColor = g.name.toLowerCase().includes("color");
          return (
            <Field key={g.id} label={g.name} value={labelOf(g)}>
              <div className="flex flex-wrap gap-2">
                {g.values.map((val) => {
                  const avail = valueAvailable(selected, g, val.id);
                  const active = selected[g.id] === val.id;
                  return (
                    <button
                      key={val.id}
                      onClick={() => pick(g, val.id)}
                      disabled={!avail}
                      title={avail ? val.label : `${val.label} — unavailable`}
                      className={`flex items-center gap-2 border px-3 py-1.5 text-sm transition ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--on-accent)]"
                          : "hover:border-[var(--foreground)]"
                      } ${!avail ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                      style={active ? undefined : { borderColor: "var(--line)" }}
                    >
                      {isColor && (val.hex ?? COLOR_HEX[val.label]) && (
                        <span
                          className="h-4 w-4 border border-black/20"
                          style={{ background: val.hex ?? COLOR_HEX[val.label] }}
                        />
                      )}
                      {val.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          );
        })}

        <Field label="Quantity">
          <div className="flex items-center gap-3">
            <div className="flex items-center border" style={{ borderColor: "var(--line)" }}>
              <button className="px-3 py-1.5" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="w-10 text-center">{qty}</span>
              <button className="px-3 py-1.5" onClick={() => setQty((q) => Math.min(stock || 1, q + 1))}>
                +
              </button>
            </div>
            <span className="text-sm text-[var(--muted)]">
              {selectedVariant ? `${stock} in stock` : "Select options"}
            </span>
          </div>
        </Field>

        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="mt-6 w-full bg-[var(--accent)] py-3.5 font-semibold text-[var(--on-accent)] transition enabled:hover:bg-[var(--foreground)] enabled:hover:text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {!selectedVariant
            ? variants.length === 0
              ? "Unavailable"
              : "Select options"
            : !inStock
              ? "Sold out"
              : added
                ? "Added to cart ✓"
                : "Add to cart"}
        </button>
        {added && (
          <Link href="/cart" className="mt-3 block text-center text-sm underline">
            View cart →
          </Link>
        )}
      </div>
    </div>
  );
}

// Clamp long descriptions to a max height with a Read more / less toggle.
function Description({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 4);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-line text-[var(--muted)] ${expanded ? "" : "max-h-32 overflow-hidden"}`}
      >
        {text}
      </p>
      {clamped && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-sm font-medium text-[var(--accent-ink)] hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-[var(--accent)] text-[var(--foreground)]"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-sm font-medium">
        {label}
        {value ? <span className="ml-2 font-normal text-[var(--muted)]">{value}</span> : null}
      </div>
      {children}
    </div>
  );
}
