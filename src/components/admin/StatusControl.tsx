"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABEL, type OrderStatus } from "@/lib/config";

const ACTIONS: { status: OrderStatus; label: string; cls: string }[] = [
  { status: "paid", label: "Confirm payment", cls: "bg-emerald-600 text-white" },
  { status: "fulfilled", label: "Mark fulfilled", cls: "bg-black text-white dark:bg-white dark:text-black" },
  { status: "rejected", label: "Reject receipt", cls: "bg-rose-600 text-white" },
  { status: "cancelled", label: "Cancel order", cls: "border border-black/20 dark:border-white/25" },
];

export default function StatusControl({
  orderNumber,
  current,
}: {
  orderNumber: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (status: OrderStatus) => {
    setBusy(status);
    const res = await fetch(`/api/admin/orders/${orderNumber}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
  };

  return (
    <div>
      <p className="text-sm text-black/55 dark:text-white/55">
        Current status: <span className="font-medium text-black dark:text-white">{STATUS_LABEL[current]}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.status}
            onClick={() => setStatus(a.status)}
            disabled={busy !== null || current === a.status}
            className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40 ${a.cls}`}
          >
            {busy === a.status ? "…" : a.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-black/45 dark:text-white/45">
        Rejecting or cancelling returns reserved stock to inventory.
      </p>
    </div>
  );
}
