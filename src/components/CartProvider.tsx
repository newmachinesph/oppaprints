"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "opp_cart_v1";

// Each variant is a unique combination, so the variant id identifies the line.
function lineKey(l: CartLine): string {
  return String(l.variantId);
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  totalWeightGrams: number;
  add: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  keyOf: (line: CartLine) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  // Persist after each change (but not before the initial hydrate).
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const add = (line: CartLine) =>
    setLines((prev) => {
      const key = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, qty: l.qty + line.qty } : l,
        );
      }
      return [...prev, line];
    });

  const setQty = (key: string, qty: number) =>
    setLines((prev) =>
      prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, qty) } : l)),
    );

  const remove = (key: string) =>
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));

  const clear = () => setLines([]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotalCents = lines.reduce((n, l) => n + l.qty * l.unitPriceCents, 0);
  const totalWeightGrams = lines.reduce((n, l) => n + l.qty * (l.weightGrams ?? 0), 0);

  return (
    <CartContext.Provider
      value={{ lines, count, subtotalCents, totalWeightGrams, add, setQty, remove, clear, keyOf: lineKey }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
