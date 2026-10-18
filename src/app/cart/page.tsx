"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatCents } from "@/lib/money";
import { imageUrl } from "@/lib/config";

export default function CartPage() {
  const { lines, subtotalCents, setQty, remove, keyOf } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/" className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your cart</h1>
      <ul className="flex flex-col gap-3">
        {lines.map((l) => {
          const key = keyOf(l);
          const meta = l.options.map((o) => o.value).join(" · ");
          return (
            <li
              key={key}
              className="flex gap-4 rounded-2xl border border-black/10 p-3 dark:border-white/10"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
                {l.imageKey && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl(l.imageKey)} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${l.slug}`} className="font-medium hover:underline">
                  {l.name}
                </Link>
                {meta && <p className="text-sm text-black/60 dark:text-white/60">{meta}</p>}
                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="flex items-center rounded-lg border border-black/15 text-sm dark:border-white/20">
                    <button className="px-2.5 py-1" onClick={() => setQty(key, l.qty - 1)}>−</button>
                    <span className="w-8 text-center">{l.qty}</span>
                    <button className="px-2.5 py-1" onClick={() => setQty(key, l.qty + 1)}>+</button>
                  </div>
                  <button
                    onClick={() => remove(key)}
                    className="text-sm text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="font-medium">{formatCents(l.unitPriceCents * l.qty)}</div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
        <span className="text-lg">Subtotal</span>
        <span className="text-xl font-semibold">{formatCents(subtotalCents)}</span>
      </div>
      <Link
        href="/checkout"
        className="mt-5 block rounded-full bg-black py-3.5 text-center font-medium text-white dark:bg-white dark:text-black"
      >
        Checkout
      </Link>
      <p className="mt-3 text-center text-sm text-black/50 dark:text-white/50">
        No account needed — pay by GCash, BPI, or Cash on Delivery.
      </p>
    </div>
  );
}
