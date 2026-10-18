"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = orderNumber.trim().toUpperCase();
    if (!num) return;
    // Hand the phone to the order page so it can auto-authorize.
    sessionStorage.setItem(`ord_${num}`, phone.trim());
    router.push(`/orders/${num}`);
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Track your order</h1>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        Enter your order number and the mobile number you used at checkout.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number (e.g. OPP-AB12CD)"
          required
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm dark:border-white/20"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number"
          required
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm dark:border-white/20"
        />
        <button className="rounded-full bg-black py-3 font-medium text-white dark:bg-white dark:text-black">
          View order
        </button>
      </form>
    </div>
  );
}
