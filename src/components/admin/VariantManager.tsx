"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { imageUrl, CURRENCY } from "@/lib/config";
import { toGrams } from "@/lib/shipping";
import type { OptionGroup, Variant } from "@/lib/types";

// Split stored grams into an editable {value, unit} pair.
function splitWeight(grams: number): { value: number; unit: "g" | "kg" } {
  return grams >= 1000 ? { value: grams / 1000, unit: "kg" } : { value: grams, unit: "g" };
}

function UnitSelect({ unit, onChange }: { unit: "g" | "kg"; onChange: (u: "g" | "kg") => void }) {
  return (
    <select
      value={unit}
      onChange={(e) => onChange(e.target.value as "g" | "kg")}
      className="border bg-transparent px-1 py-1.5 text-sm"
      style={{ borderColor: "var(--line)" }}
    >
      <option value="g">g</option>
      <option value="kg">kg</option>
    </select>
  );
}

export default function VariantManager({
  productId,
  basePriceCents,
  groups,
  variants,
}: {
  productId: number;
  basePriceCents: number;
  groups: OptionGroup[];
  variants: Variant[];
}) {
  const valueLabel = new Map<number, string>();
  const groupName = new Map<number, string>();
  for (const g of groups) {
    groupName.set(g.id, g.name);
    for (const v of g.values) valueLabel.set(v.id, v.label);
  }
  const comboLabel = (v: Variant) =>
    groups.length === 0
      ? "Default"
      : groups
          .map((g) => v.options.find((o) => o.group_id === g.id)?.value_id)
          .map((vid) => (vid != null ? valueLabel.get(vid) : "—"))
          .join(" / ");

  return (
    <div className="border p-4" style={{ borderColor: "var(--line)" }}>
      {variants.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No variants yet. Add combinations below.</p>
      )}
      {variants.map((v) => (
        <VariantRow
          key={v.id}
          productId={productId}
          v={v}
          label={comboLabel(v)}
          basePriceCents={basePriceCents}
        />
      ))}
      <AddVariant productId={productId} groups={groups} />
    </div>
  );
}

function VariantRow({
  productId,
  v,
  label,
  basePriceCents,
}: {
  productId: number;
  v: Variant;
  label: string;
  basePriceCents: number;
}) {
  const router = useRouter();
  const [stock, setStock] = useState(v.stock);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const initialWeight = splitWeight(v.weight_grams ?? 0);
  const [wVal, setWVal] = useState(initialWeight.value);
  const [wUnit, setWUnit] = useState<"g" | "kg">(initialWeight.unit);
  const [wBusy, setWBusy] = useState(false);
  const [wSaved, setWSaved] = useState(false);

  const saveStock = async () => {
    setBusy(true);
    setSaved(false);
    const res = await fetch(`/api/admin/variants/${v.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }
  };

  const [price, setPrice] = useState(v.price_cents != null ? String(v.price_cents / 100) : "");
  const [pBusy, setPBusy] = useState(false);
  const [pSaved, setPSaved] = useState(false);

  const priceCents = price.trim() === "" ? null : Math.round(parseFloat(price) * 100);
  const priceDirty = priceCents !== (v.price_cents ?? null);
  const savePrice = async () => {
    if (priceCents !== null && (!Number.isFinite(priceCents) || priceCents < 0)) return;
    setPBusy(true);
    setPSaved(false);
    const res = await fetch(`/api/admin/variants/${v.id}/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceCents }),
    });
    setPBusy(false);
    if (res.ok) {
      setPSaved(true);
      setTimeout(() => setPSaved(false), 1200);
    }
  };

  const grams = toGrams(wVal, wUnit);
  const saveWeight = async () => {
    setWBusy(true);
    setWSaved(false);
    const res = await fetch(`/api/admin/variants/${v.id}/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightGrams: grams }),
    });
    setWBusy(false);
    if (res.ok) {
      setWSaved(true);
      setTimeout(() => setWSaved(false), 1200);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete variant "${label}"?`)) return;
    await fetch(`/api/admin/products/${productId}/variants/${v.id}`, { method: "DELETE" });
    router.refresh();
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/admin/variants/${v.id}/image`, { method: "POST", body: fd });
    router.refresh();
  };
  const deleteImage = async () => {
    await fetch(`/api/admin/variants/${v.id}/image`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t py-2 first:border-t-0" style={{ borderColor: "var(--line)" }}>
      <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden border" style={{ borderColor: "var(--line)" }}>
        {v.image_key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(v.image_key)} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg text-[var(--muted)]">+</span>
        )}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f);
            e.target.value = "";
          }}
        />
      </label>
      {v.image_key && (
        <button onClick={deleteImage} aria-label="Remove image" className="text-xs text-[var(--muted)] hover:text-rose-600">
          ✕img
        </button>
      )}
      <div className="flex-1">
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xs text-[var(--muted)]">{CURRENCY}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder={`base ${(basePriceCents / 100).toFixed(2)}`}
        className="w-24 border bg-transparent px-2 py-1.5 text-sm"
        style={{ borderColor: "var(--line)" }}
      />
      <button
        onClick={savePrice}
        disabled={pBusy || !priceDirty}
        className="bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)] disabled:opacity-40"
      >
        {pSaved ? "✓" : pBusy ? "…" : "Save"}
      </button>
      <input
        type="number"
        min={0}
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
        className="w-20 border bg-transparent px-2 py-1.5 text-sm"
        style={{ borderColor: "var(--line)" }}
      />
      <button
        onClick={saveStock}
        disabled={busy || stock === v.stock}
        className="bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)] disabled:opacity-40"
      >
        {saved ? "✓" : busy ? "…" : "Save"}
      </button>
      <span className="ml-1 text-xs text-[var(--muted)]">Wt</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={wVal}
        onChange={(e) => setWVal(Number(e.target.value))}
        className="w-20 border bg-transparent px-2 py-1.5 text-sm"
        style={{ borderColor: "var(--line)" }}
      />
      <UnitSelect unit={wUnit} onChange={setWUnit} />
      <button
        onClick={saveWeight}
        disabled={wBusy || grams === (v.weight_grams ?? 0)}
        className="bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)] disabled:opacity-40"
      >
        {wSaved ? "✓" : wBusy ? "…" : "Save"}
      </button>
      <button onClick={remove} aria-label="Delete variant" className="px-2 py-1.5 text-sm text-rose-600">
        ✕
      </button>
    </div>
  );
}

function AddVariant({ productId, groups }: { productId: number; groups: OptionGroup[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Record<number, number>>({});
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState("");
  const [wVal, setWVal] = useState(0);
  const [wUnit, setWUnit] = useState<"g" | "kg">("g");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: sel,
          stock,
          weightGrams: toGrams(wVal, wUnit),
          priceCents: price.trim() === "" ? null : Math.round(parseFloat(price) * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add");
        return;
      }
      setSel({});
      setStock(0);
      setPrice("");
      setWVal(0);
      setWUnit("g");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--line)" }}>
      <p className="mb-2 text-sm font-medium">Add a combination</p>
      <div className="flex flex-wrap items-end gap-2">
        {groups.map((g) => (
          <label key={g.id} className="text-xs">
            {g.name}
            <select
              value={sel[g.id] ?? ""}
              onChange={(e) => setSel((s) => ({ ...s, [g.id]: Number(e.target.value) }))}
              className="mt-1 block border bg-transparent px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--line)" }}
            >
              <option value="">Choose…</option>
              {g.values.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="text-xs">
          Stock
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="mt-1 block w-20 border bg-transparent px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="text-xs">
          Price {CURRENCY} (blank = base)
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="base"
            className="mt-1 block w-24 border bg-transparent px-2 py-1.5 text-sm"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="text-xs">
          Weight
          <div className="mt-1 flex items-center gap-1">
            <input
              type="number"
              min={0}
              step="0.01"
              value={wVal}
              onChange={(e) => setWVal(Number(e.target.value))}
              className="block w-20 border bg-transparent px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--line)" }}
            />
            <UnitSelect unit={wUnit} onChange={setWUnit} />
          </div>
        </label>
        <button
          onClick={add}
          disabled={busy}
          className="bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
