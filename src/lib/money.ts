import { CURRENCY } from "./config";

// Prices stored as integer centavos to avoid float drift.
export function formatCents(cents: number): string {
  return `${CURRENCY}${(cents / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
