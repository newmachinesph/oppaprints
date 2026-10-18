// Unit price = variant override, or the product base price when null.
export function unitPriceCents(
  product: { price_cents: number },
  variant: { price_cents: number | null },
): number {
  return variant.price_cents ?? product.price_cents;
}
