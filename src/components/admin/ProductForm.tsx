"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY } from "@/lib/config";
import type { Product } from "@/lib/types";

type Mode = "create" | "edit";

export default function ProductForm({
  mode,
  product,
}: {
  mode: Mode;
  product?: Product;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price_cents / 100) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toCents = (v: string) => Math.round(parseFloat(v || "0") * 100);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name,
      slug,
      description,
      priceCents: toCents(price),
      category,
      active,
    };
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/products" : `/api/admin/products/${product!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (mode === "create") router.push(`/admin/products/${data.product.id}`);
      else {
        if (data.slug) setSlug(data.slug);
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}" and all its variants/images? This cannot be undone.`)) return;
    setBusy(true);
    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="border border-black/10 p-4 dark:border-white/10">
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
        </Field>
        <Field
          label={
            mode === "create"
              ? "Slug (optional — auto from name)"
              : "Slug (URL) — a unique suffix is added if taken"
          }
        >
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated"
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
        <Field label={`Base price (${CURRENCY})`}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className={inputCls}
          />
        </Field>
        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Packaging & Wrapping"
            className={inputCls}
          />
        </Field>

        {mode === "create" && (
          <p className="text-xs text-[var(--muted)]">
            After creating, define this product&apos;s options (Size, Color, Name…) and add its
            variant combinations with stock and images.
          </p>
        )}

        {mode === "edit" && (
          <Check label="Visible in store (active)" checked={active} onChange={setActive} />
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {busy ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={del}
              disabled={busy}
              className="ml-auto border border-rose-300 px-4 py-2.5 text-sm text-rose-600 disabled:opacity-40 dark:border-rose-900"
            >
              Delete product
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
