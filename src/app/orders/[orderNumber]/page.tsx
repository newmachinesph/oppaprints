"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import { STATUS_LABEL, type OrderStatus } from "@/lib/config";
import type { OrderItem } from "@/lib/types";

type OrderView = {
  order_number: string;
  status: OrderStatus;
  subtotal_cents: number;
  region: string | null;
  shipping_cents: number;
  vat_cents: number;
  has_receipt: boolean;
  payment_method: "qr" | "cod" | null;
  note: string | null;
  created_at: string;
  customer_name: string;
  customer_address: string | null;
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  awaiting_review: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  cancelled: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export default function OrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (ph: string) => {
      setError(null);
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone: ph }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found");
        setOrder(null);
        return false;
      }
      setOrder(data.order);
      setItems(data.items);
      return true;
    },
    [orderNumber],
  );

  // Auto-load if we stored the phone at checkout.
  useEffect(() => {
    const saved = sessionStorage.getItem(`ord_${orderNumber}`);
    if (saved) {
      setPhone(saved);
      load(saved).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber, load]);

  if (loading) {
    return <div className="mx-auto max-w-xl px-5 py-20 text-center text-black/50">Loading…</div>;
  }

  // Phone gate when we don't already have it.
  if (!order) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-2xl font-semibold">Track order {orderNumber}</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Enter the mobile number used at checkout to view this order.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await load(phone);
            if (ok) sessionStorage.setItem(`ord_${orderNumber}`, phone.trim());
          }}
          className="mt-5 flex gap-2"
        >
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxxx"
            required
            className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          <button className="rounded-lg bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black">
            View
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  const codConfirmed = order.payment_method === "cod" && order.status === "awaiting_review";
  const showPayment =
    ["pending", "awaiting_review", "rejected"].includes(order.status) && !codConfirmed;
  const canEditAddress = order.status !== "fulfilled" && order.status !== "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Order {order.order_number}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <ul className="mt-6 flex flex-col gap-2 rounded-2xl border border-black/10 p-4 text-sm dark:border-white/10">
        {items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3">
            <span>
              {it.qty}× {it.product_name}
              {it.options && it.options.length > 0 && (
                <span className="text-black/50 dark:text-white/50">
                  {" "}({it.options.map((o) => o.value).join(", ")})
                </span>
              )}
            </span>
            <span>{formatCents(it.unit_price_cents * it.qty)}</span>
          </li>
        ))}
        <li className="mt-1 flex justify-between border-t border-black/10 pt-2 text-black/60 dark:border-white/10 dark:text-white/60">
          <span>Subtotal</span>
          <span>{formatCents(order.subtotal_cents)}</span>
        </li>
        {order.vat_cents > 0 && (
          <li className="flex justify-between text-black/60 dark:text-white/60">
            <span>VAT (12%)</span>
            <span>{formatCents(order.vat_cents)}</span>
          </li>
        )}
        <li className="flex justify-between text-black/60 dark:text-white/60">
          <span>Shipping{order.region ? ` · ${order.region}` : ""}</span>
          <span>{formatCents(order.shipping_cents)}</span>
        </li>
        <li className="flex justify-between border-t border-black/10 pt-2 font-semibold dark:border-white/10">
          <span>Total</span>
          <span>{formatCents(order.subtotal_cents + order.vat_cents + order.shipping_cents)}</span>
        </li>
      </ul>

      {order.status === "paid" || order.status === "fulfilled" ? (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <p className="font-medium">Payment confirmed 🎉</p>
          <p className="mt-1 text-sm">
            We&apos;re preparing your order. We&apos;ll reach you at your number for delivery updates.
          </p>
        </div>
      ) : order.status === "cancelled" ? (
        <p className="mt-6 text-black/60 dark:text-white/60">This order was cancelled.</p>
      ) : codConfirmed ? (
        <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Cash on Delivery confirmed 🛵</p>
          <p className="mt-1 text-sm">
            Pay the rider in cash when your order arrives. We&apos;ll confirm and prepare it shortly.
          </p>
        </div>
      ) : null}

      {canEditAddress && (
        <AddressCard
          orderNumber={order.order_number}
          phone={phone}
          address={order.customer_address}
          onSaved={() => load(phone)}
        />
      )}

      {showPayment && (
        <PaymentSection
          orderNumber={order.order_number}
          phone={phone}
          status={order.status}
          onUpdated={() => load(phone)}
        />
      )}

      <Link href="/" className="mt-8 inline-block text-sm underline">
        Continue shopping
      </Link>
    </div>
  );
}

const TABS: { id: string; label: string; img?: string }[] = [
  { id: "gcash", label: "GCash", img: "/qr2.jpeg" },
  { id: "bpi", label: "BPI", img: "/qr1.jpeg" },
  { id: "cod", label: "Cash on Delivery" },
];

function PaymentSection({
  orderNumber,
  phone,
  status,
  onUpdated,
}: {
  orderNumber: string;
  phone: string;
  status: OrderStatus;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState(TABS[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codEnabled, setCodEnabled] = useState(true);

  // COD can be disabled by the admin — hide the tab when off.
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setCodEnabled(d.codEnabled !== false))
      .catch(() => {});
  }, []);

  const visibleTabs = codEnabled ? TABS : TABS.filter((t) => t.id !== "cod");
  const active = visibleTabs.find((t) => t.id === tab) ?? visibleTabs[0];

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("phone", phone);
      const res = await fetch(`/api/orders/${orderNumber}/receipt`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setFile(null);
      onUpdated();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const confirmCod = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/cod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not confirm");
        return;
      }
      onUpdated();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <h2 className="font-medium">Choose how to pay</h2>
      {status === "awaiting_review" && (
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Receipt received — we&apos;re reviewing your payment. You can re-upload if needed.
        </p>
      )}
      {status === "rejected" && (
        <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
          Your previous receipt was rejected. Please pay again and upload a clear receipt.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/15 dark:border-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active.id === "cod" ? (
        <div className="mt-4 rounded-xl bg-stone-50 p-5 text-sm dark:bg-white/5">
          <p className="text-black/70 dark:text-white/70">
            Pay in cash when your order is delivered — no receipt needed. Confirm below and
            we&apos;ll prepare your order.
          </p>
          {error && <p className="mt-2 text-rose-600">{error}</p>}
          <button
            onClick={confirmCod}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-black py-3 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {busy ? "Confirming…" : "Confirm Cash on Delivery"}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col items-center rounded-xl bg-stone-50 p-4 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.img}
              alt={`${active.label} QR`}
              className="h-auto w-full max-w-md bg-white object-contain p-2"
            />
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Scan with {active.label} and pay the total above.
            </p>
          </div>

          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-white dark:file:bg-white dark:file:text-black"
            />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            <button
              onClick={upload}
              disabled={!file || busy}
              className="mt-3 w-full rounded-full bg-black py-3 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {busy ? "Uploading…" : "Submit receipt"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AddressCard({
  orderNumber,
  phone,
  address,
  onSaved,
}: {
  orderNumber: string;
  phone: string;
  address: string | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(address ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, address: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setEditing(false);
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Delivery address</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm underline">
            {address ? "Edit" : "Add address"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            placeholder="House/unit, street, barangay, city, province"
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
          />
          {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              onClick={save}
              disabled={busy || !value.trim()}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {busy ? "Saving…" : "Save address"}
            </button>
            <button
              onClick={() => {
                setValue(address ?? "");
                setEditing(false);
              }}
              className="rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-line text-sm text-black/60 dark:text-white/60">
          {address || "No delivery address yet."}
        </p>
      )}
    </div>
  );
}
