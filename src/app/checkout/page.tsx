"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatCents } from "@/lib/money";
import { vatCents, VAT_RATE } from "@/lib/config";
import { REGIONS, shippingCents, formatWeight, isRegion } from "@/lib/shipping";
import ShippingRatesTable from "@/components/ShippingRatesTable";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotalCents, totalWeightGrams, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [region, setRegion] = useState("");
  const [note, setNote] = useState("");
  const [vatEnabled, setVatEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Whether VAT applies is an admin setting — read it for the live breakdown.
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setVatEnabled(!!d.vatEnabled))
      .catch(() => {});
  }, []);

  const vat = vatCents(subtotalCents, vatEnabled);
  const shipping = isRegion(region) ? shippingCents(totalWeightGrams, region) : null;
  const total = subtotalCents + vat + (shipping ?? 0);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isRegion(region)) {
      setError("Please select a delivery region");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          note,
          region,
          items: lines.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      // Remember the phone so the tracking page can auto-load this order.
      sessionStorage.setItem(`ord_${data.orderNumber}`, form.phone.trim());
      clear();
      router.push(`/orders/${data.orderNumber}`);
    } catch {
      setError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <Link href="/" className="mt-4 inline-block underline">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-5 py-8 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="order-2 md:order-1">
        <h1 className="mb-5 text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="mb-5 text-sm text-black/60 dark:text-white/60">
          No account needed. We just need your contact and delivery details.
        </p>
        <div className="flex flex-col gap-4">
          <Input label="Full name" required value={form.name} onChange={set("name")} />
          <Input label="Mobile number" required value={form.phone} onChange={set("phone")} placeholder="09xx xxx xxxx" />
          <Input label="Email (optional)" type="email" value={form.email} onChange={set("email")} />
          <label className="text-sm font-medium">
            Delivery address
            <textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
            />
          </label>
          <label className="text-sm font-medium">
            Delivery region
            <select
              required
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
            >
              <option value="">Select region…</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-black/50 dark:text-white/50">
              Shipping is computed from your region and total order weight.
            </span>
          </label>
          <label className="text-sm font-medium">
            Order note (optional)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-black py-3.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {busy ? "Placing order…" : "Place order"}
        </button>
        <p className="mt-3 text-center text-xs text-black/50 dark:text-white/50">
          Next: pay via GCash or BPI (upload receipt), or choose Cash on Delivery.
        </p>
      </form>

      <aside className="order-1 h-fit rounded-2xl border border-black/10 p-4 md:order-2 dark:border-white/10">
        <h2 className="mb-3 font-medium">Order summary</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="text-black/70 dark:text-white/70">
                {l.qty}× {l.name}
                {l.options.length > 0 && (
                  <span className="text-black/45 dark:text-white/45">
                    {" "}({l.options.map((o) => o.value).join(", ")})
                  </span>
                )}
              </span>
              <span>{formatCents(l.unitPriceCents * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-1.5 border-t border-black/10 pt-3 text-sm dark:border-white/10">
          <Row label="Subtotal" value={formatCents(subtotalCents)} />
          {vatEnabled && <Row label={`VAT (${Math.round(VAT_RATE * 100)}%)`} value={formatCents(vat)} />}
          <Row
            label={`Shipping${isRegion(region) ? ` · ${region}` : ""}`}
            value={shipping === null ? "Select region" : formatCents(shipping)}
            muted={shipping === null}
          />
          {totalWeightGrams > 0 && (
            <p className="text-xs text-black/45 dark:text-white/45">
              Total weight: {formatWeight(totalWeightGrams)}
            </p>
          )}
        </div>
        <div className="mt-3 flex justify-between border-t border-black/10 pt-3 font-semibold dark:border-white/10">
          <span>Total</span>
          <span>{shipping === null ? "—" : formatCents(total)}</span>
        </div>
        <p className="mt-3 rounded-lg bg-pink-100 px-3 py-2 text-xs text-black/70 dark:bg-pink-950/30 dark:text-white/70">
          Note: Prices are VAT-exclusive. For an Official Receipt (O.R.), additional
          VAT applies to the total.
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
            View shipping rates
          </summary>
          <div className="mt-2">
            <ShippingRatesTable />
          </div>
        </details>
      </aside>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-black/60 dark:text-white/60">{label}</span>
      <span className={muted ? "text-black/40 dark:text-white/40" : undefined}>{value}</span>
    </div>
  );
}

function Input({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        {...rest}
        className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
      />
    </label>
  );
}
