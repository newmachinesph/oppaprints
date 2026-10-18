import type { OrderStatus } from "./config";

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  category: string | null;
  text_upcharge_cents: number; // legacy, unused by the option model
  has_color: boolean; // legacy
  has_size: boolean; // legacy
  has_text: boolean; // legacy
  active: boolean;
  created_at: string;
};

export type OptionValue = {
  id: number;
  group_id: number;
  label: string;
  position: number;
  hex: string | null; // swatch colour for colour groups; null → COLOR_HEX fallback
};

export type OptionGroup = {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: OptionValue[];
};

// A variant is one combination: one value per group, with its own stock/price.
export type Variant = {
  id: number;
  product_id: number;
  sku: string;
  price_cents: number | null; // null → use product.price_cents
  stock: number;
  weight_grams: number; // shipping weight for this combination
  image_key: string | null; // optional per-combination image
  options: { group_id: number; value_id: number }[];
};

export type ProductImage = {
  id: number;
  product_id: number;
  key: string;
  sort: number;
  is_primary: boolean;
};

export type ProductWithDetail = Product & {
  groups: OptionGroup[];
  variants: Variant[];
  images: ProductImage[];
};

// Snapshot of the chosen options on an order line.
export type SelectedOption = { group: string; value: string };

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  options: SelectedOption[] | null;
  qty: number;
  unit_price_cents: number;
};

export type Order = {
  id: number;
  order_number: string;
  customer_id: number;
  status: OrderStatus;
  subtotal_cents: number; // goods only, VAT-exclusive
  region: string | null;
  shipping_cents: number;
  vat_cents: number;
  weight_grams: number;
  receipt_key: string | null;
  payment_method: "qr" | "cod" | null;
  note: string | null;
  created_at: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
};

// Cart line held client-side in localStorage. variantId identifies the combo.
export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  variantId: number;
  options: SelectedOption[];
  qty: number;
  unitPriceCents: number;
  weightGrams: number;
  imageKey: string | null;
};
