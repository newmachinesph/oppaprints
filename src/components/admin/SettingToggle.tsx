"use client";

import { useState } from "react";

// Generic on/off switch for a boolean store setting (VAT, COD, …).
// `field` is the /api/admin/settings body key ("vatEnabled" | "codEnabled").
export default function SettingToggle({
  field,
  label,
  onText,
  offText,
  initial,
}: {
  field: string;
  label: string;
  onText: string;
  offText: string;
  initial: boolean;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setBusy(true);
    setEnabled(next); // optimistic
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
    setBusy(false);
    if (!res.ok) setEnabled(!next); // rollback on failure
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="flex items-center gap-3 rounded-2xl border border-black/10 p-4 text-left disabled:opacity-50 dark:border-white/10"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-emerald-500" : "bg-black/20 dark:bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-black/55 dark:text-white/55">
          {enabled ? onText : offText}
        </span>
      </span>
    </button>
  );
}
