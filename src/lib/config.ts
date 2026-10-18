// Store-wide constants. Shared by client + server (no secrets here).

export const STORE_NAME = "Oppa Prints";
export const STORE_TAGLINE = "You Think We Print";
export const CURRENCY = "₱"; // Philippine peso ₱

// Master variant vocabularies. Each product exposes a subset.
export const COLORS = [
  { name: "Beige", hex: "#E8DCC4" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "Lavender", hex: "#C4B5E0" },
  { name: "Pink", hex: "#F4C2D7" },
  { name: "Pastel Blue", hex: "#AFCBE3" },
  { name: "Sky Blue", hex: "#7EC8E3" },
  { name: "Orange", hex: "#F59E42" },
  { name: "Red", hex: "#D64545" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Navy Blue", hex: "#1E3A5F" },
] as const;

export const COLOR_HEX: Record<string, string> = Object.fromEntries(
  COLORS.map((c) => [c.name, c.hex]),
);

// Validate/normalize a swatch hex. Returns "#rrggbb", null (unset), or false (bad input).
export function normalizeHex(hex: unknown): string | null | false {
  if (hex == null || hex === "") return null;
  if (typeof hex !== "string") return false;
  const h = hex.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(h) ? h : false;
}

export const SIZES = ["Small", "Large"] as const;

export const TEXT_OPTIONS = [
  "Plain Box (No Text)",
  "Outer Text Only",
  "Inner Text Only",
  "Outer and Inner Text",
] as const;
export type TextOption = (typeof TEXT_OPTIONS)[number];

// Which text fields a given text option requires from the customer.
export function textFieldsFor(opt: string): { outer: boolean; inner: boolean } {
  return {
    outer: opt === "Outer Text Only" || opt === "Outer and Inner Text",
    inner: opt === "Inner Text Only" || opt === "Outer and Inner Text",
  };
}

// Order lifecycle.
export const ORDER_STATUSES = [
  "pending", // created, awaiting receipt upload
  "awaiting_review", // receipt uploaded, admin to verify
  "paid", // admin confirmed payment
  "fulfilled", // shipped/handed over
  "rejected", // receipt rejected
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending payment",
  awaiting_review: "Under review",
  paid: "Paid",
  fulfilled: "Fulfilled",
  rejected: "Payment rejected",
  cancelled: "Cancelled",
};

export const LOW_STOCK_THRESHOLD = 5;

// Philippine VAT. Charged on the goods subtotal only (shipping excluded).
export const VAT_RATE = 0.12;
export function vatCents(subtotalCents: number, enabled: boolean): number {
  return enabled ? Math.round(subtotalCents * VAT_RATE) : 0;
}

// Product images are served through our own route (keeps R2 creds server-side).
export const imageUrl = (key: string): string => `/api/images/${key}`;
