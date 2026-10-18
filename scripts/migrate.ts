// Idempotent additive migrations (safe to re-run). Run: npx tsx scripts/migrate.ts
import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text`;
  console.log("migrated: orders.payment_method");

  // Per-variant shipping weight (grams).
  await sql`ALTER TABLE variants ADD COLUMN IF NOT EXISTS weight_grams int NOT NULL DEFAULT 0`;
  console.log("migrated: variants.weight_grams");

  // Order-level shipping + VAT snapshot. subtotal_cents stays goods-only.
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS region text`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cents int NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS vat_cents int NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_grams int NOT NULL DEFAULT 0`;
  console.log("migrated: orders.region/shipping_cents/vat_cents/weight_grams");

  // Key/value store for admin-toggleable settings (e.g. vat_enabled).
  await sql`CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL)`;
  console.log("migrated: settings table");

  // Per-value swatch colour (admin-managed). Null → fall back to COLOR_HEX.
  await sql`ALTER TABLE option_values ADD COLUMN IF NOT EXISTS hex text`;
  console.log("migrated: option_values.hex");

  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
