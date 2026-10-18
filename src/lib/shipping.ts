// Region-tiered shipping rates (see the courier rate card). Prices in centavos.
// Weight tiers are upper bounds in grams; a package falls in the first tier it
// does not exceed. Columns follow REGIONS order.

export const REGIONS = ["NCR", "Luzon", "Visayas", "Mindanao"] as const;
export type Region = (typeof REGIONS)[number];

export function isRegion(x: unknown): x is Region {
  return typeof x === "string" && (REGIONS as readonly string[]).includes(x);
}

// max grams (inclusive upper bound), display label, [NCR, Luzon, Visayas, Mindanao] pesos
const TIERS: { max: number; label: string; pesos: [number, number, number, number] }[] = [
  { max: 500, label: "0g - 500g", pesos: [85, 95, 100, 105] },
  { max: 1000, label: "501g - 1kg", pesos: [115, 165, 180, 195] },
  { max: 3000, label: "1.01kg - 3kg", pesos: [155, 190, 200, 220] },
  { max: 4000, label: "3.01kg - 4kg", pesos: [200, 280, 300, 330] },
  { max: 5000, label: "4.01kg - 5kg", pesos: [220, 320, 370, 370] },
  { max: 6000, label: "5.01kg - 6kg", pesos: [255, 375, 435, 435] },
  { max: 7000, label: "6.01kg - 7kg", pesos: [295, 435, 505, 505] },
  { max: 8000, label: "7.01kg - 8kg", pesos: [335, 495, 575, 575] },
  { max: 9000, label: "8.01kg - 9kg", pesos: [375, 555, 645, 645] },
  { max: 10000, label: "9.01kg - 10kg", pesos: [415, 615, 715, 715] },
];

// Display rows for the rate table (prices in centavos, columns follow REGIONS).
export const SHIPPING_ROWS = TIERS.map((t) => ({
  label: t.label,
  cents: t.pesos.map((p) => p * 100) as [number, number, number, number],
}));

// Shipping cost in centavos for a total package weight + destination region.
// ponytail: >10kg charged at the top (10kg) tier — extend TIERS if heavier
// orders become common (currently they'd be undercharged on freight).
export function shippingCents(totalGrams: number, region: Region): number {
  const col = REGIONS.indexOf(region);
  const tier = TIERS.find((t) => totalGrams <= t.max) ?? TIERS[TIERS.length - 1];
  return tier.pesos[col] * 100;
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${Number.isInteger(kg) ? kg : kg.toFixed(2)} kg`;
  }
  return `${grams} g`;
}

// Admin enters a number + unit; we store grams.
export function toGrams(value: number, unit: "g" | "kg"): number {
  return Math.round(unit === "kg" ? value * 1000 : value);
}

// demo: run `npx tsx src/lib/shipping.ts` (guarded so it never runs client-side)
if (typeof process !== "undefined" && process.argv?.[1]?.endsWith("shipping.ts")) {
  const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
  assert(shippingCents(500, "NCR") === 8500, "0-500 NCR");
  assert(shippingCents(501, "Luzon") === 16500, "501-1kg Luzon boundary");
  assert(shippingCents(3000, "Mindanao") === 22000, "3kg Mindanao");
  assert(shippingCents(999999, "Visayas") === 71500, ">10kg falls to top tier");
  assert(toGrams(1.5, "kg") === 1500 && toGrams(250, "g") === 250, "toGrams");
  assert(formatWeight(1500) === "1.50 kg" && formatWeight(500) === "500 g", "formatWeight");
  console.log("shipping.ts ok");
}
