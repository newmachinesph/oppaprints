// Server-only read helpers for the flexible option model.
import { sql } from "./db";
import type {
  Product,
  OptionGroup,
  OptionValue,
  Variant,
  ProductImage,
  ProductWithDetail,
  Order,
  OrderItem,
  Customer,
} from "./types";

export type ProductCardData = Product & {
  primary_key: string | null;
  total_stock: number;
  group_names: string | null;
  sold: number;
};

export type SortKey = "popular" | "latest" | "topsales" | "price";

export async function storefrontProducts(opts?: {
  category?: string | null;
  sort?: string | null;
}): Promise<ProductCardData[]> {
  const category = opts?.category ?? null;
  // Filter by category in SQL (few products → sort in JS, avoids dynamic SQL).
  const rows = (await sql`
    SELECT p.*,
      (SELECT key FROM product_images pi WHERE pi.product_id = p.id
        ORDER BY is_primary DESC, sort ASC LIMIT 1) AS primary_key,
      COALESCE((SELECT SUM(stock) FROM variants v WHERE v.product_id = p.id), 0)::int AS total_stock,
      (SELECT string_agg(name, ' / ' ORDER BY position) FROM option_groups og WHERE og.product_id = p.id) AS group_names,
      COALESCE((SELECT SUM(qty) FROM order_items oi WHERE oi.product_id = p.id), 0)::int AS sold
    FROM products p
    WHERE p.active = true AND (${category}::text IS NULL OR p.category = ${category})
    ORDER BY p.id
  `) as ProductCardData[];

  const sort = (opts?.sort ?? "popular") as SortKey;
  const byId = (a: ProductCardData, b: ProductCardData) => a.id - b.id;
  const sorters: Record<SortKey, (a: ProductCardData, b: ProductCardData) => number> = {
    popular: (a, b) => b.sold - a.sold || byId(a, b),
    topsales: (a, b) => b.sold - a.sold || byId(a, b),
    latest: (a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0),
    price: (a, b) => a.price_cents - b.price_cents || byId(a, b),
  };
  return [...rows].sort(sorters[sort] ?? byId);
}

export async function categories(): Promise<{ category: string; n: number }[]> {
  return (await sql`
    SELECT category, COUNT(*)::int AS n
    FROM products WHERE active = true AND category IS NOT NULL
    GROUP BY category ORDER BY category
  `) as { category: string; n: number }[];
}

async function loadGroups(productId: number): Promise<OptionGroup[]> {
  const groups = (await sql`
    SELECT * FROM option_groups WHERE product_id = ${productId} ORDER BY position, id
  `) as OptionGroup[];
  if (!groups.length) return [];
  const ids = groups.map((g) => g.id);
  const values = (await sql`
    SELECT * FROM option_values WHERE group_id = ANY(${ids}) ORDER BY position, id
  `) as OptionValue[];
  return groups.map((g) => ({ ...g, values: values.filter((v) => v.group_id === g.id) }));
}

async function loadVariants(productId: number): Promise<Variant[]> {
  const rows = (await sql`
    SELECT id, product_id, sku, price_cents, stock, weight_grams, image_key
    FROM variants WHERE product_id = ${productId} ORDER BY id
  `) as Omit<Variant, "options">[];
  if (!rows.length) return [];
  const ids = rows.map((v) => v.id);
  const opts = (await sql`
    SELECT variant_id, group_id, value_id FROM variant_options WHERE variant_id = ANY(${ids})
  `) as { variant_id: number; group_id: number; value_id: number }[];
  return rows.map((v) => ({
    ...v,
    options: opts
      .filter((o) => o.variant_id === v.id)
      .map((o) => ({ group_id: o.group_id, value_id: o.value_id })),
  }));
}

export async function productBySlug(slug: string): Promise<ProductWithDetail | null> {
  const rows = (await sql`SELECT * FROM products WHERE slug = ${slug}`) as Product[];
  const product = rows[0];
  if (!product) return null;
  const groups = await loadGroups(product.id);
  const variants = await loadVariants(product.id);
  const images = (await sql`
    SELECT * FROM product_images WHERE product_id = ${product.id} ORDER BY is_primary DESC, sort ASC
  `) as ProductImage[];
  return { ...product, groups, variants, images };
}

// Same detail, by id (admin).
export async function productById(id: number): Promise<ProductWithDetail | null> {
  const rows = (await sql`SELECT * FROM products WHERE id = ${id}`) as Product[];
  const product = rows[0];
  if (!product) return null;
  const groups = await loadGroups(id);
  const variants = await loadVariants(id);
  const images = (await sql`
    SELECT * FROM product_images WHERE product_id = ${id} ORDER BY is_primary DESC, sort ASC
  `) as ProductImage[];
  return { ...product, groups, variants, images };
}

export type AdminProductRow = Product & {
  image_count: number;
  total_stock: number;
  variant_count: number;
};

export async function adminProducts(): Promise<AdminProductRow[]> {
  return (await sql`
    SELECT p.*,
      (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id)::int AS image_count,
      (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id)::int AS variant_count,
      COALESCE((SELECT SUM(stock) FROM variants v WHERE v.product_id = p.id), 0)::int AS total_stock
    FROM products p
    ORDER BY p.id
  `) as AdminProductRow[];
}

export type OrderWithCustomer = Order & {
  customer_name: string;
  customer_phone: string;
};

export async function adminOrders(): Promise<OrderWithCustomer[]> {
  return (await sql`
    SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `) as OrderWithCustomer[];
}

export type FullOrder = Order & {
  customer: Customer;
  items: OrderItem[];
};

export async function orderByNumber(orderNumber: string): Promise<FullOrder | null> {
  const rows = (await sql`SELECT * FROM orders WHERE order_number = ${orderNumber}`) as Order[];
  const order = rows[0];
  if (!order) return null;
  const custRows = (await sql`SELECT * FROM customers WHERE id = ${order.customer_id}`) as Customer[];
  const items = (await sql`
    SELECT id, order_id, product_id, variant_id, product_name, options, qty, unit_price_cents
    FROM order_items WHERE order_id = ${order.id} ORDER BY id
  `) as OrderItem[];
  return { ...order, customer: custRows[0], items };
}
