// (Re)build the flexible option model for all seeded products from catalog.ts.
// Idempotent: wipes each product's groups/variants and rebuilds. Keeps products
// + images. Run: npx tsx scripts/build-options.ts
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { PRODUCTS, CATEGORY, buildOptions } from "./catalog.ts";

const sql = neon(process.env.DATABASE_URL!);

async function ddl() {
  await sql`CREATE TABLE IF NOT EXISTS option_groups (
    id serial PRIMARY KEY,
    product_id int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name text NOT NULL,
    position int NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS option_values (
    id serial PRIMARY KEY,
    group_id int NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    label text NOT NULL,
    position int NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS variant_options (
    variant_id int NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    group_id int NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    value_id int NOT NULL REFERENCES option_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, group_id)
  )`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS options jsonb`;
  await sql`ALTER TABLE variants ADD COLUMN IF NOT EXISTS image_key text`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS category text`;
  // Old model enforced one variant per (color,size); the new model allows many
  // variants with null color/size (combo lives in variant_options).
  await sql`DROP INDEX IF EXISTS variants_combo`;
  console.log("tables ready, legacy index dropped");
}

async function main() {
  await ddl();
  const stock = { n: 0 };
  for (const def of PRODUCTS) {
    const rows = (await sql`SELECT id FROM products WHERE slug = ${def.slug}`) as { id: number }[];
    if (!rows[0]) {
      console.log(`  ${def.slug}: not found, skipped`);
      continue;
    }
    const id = rows[0].id;
    await sql`UPDATE products SET category = ${CATEGORY[def.slug] ?? null} WHERE id = ${id}`;
    await sql`DELETE FROM option_groups WHERE product_id = ${id}`;
    await sql`DELETE FROM variants WHERE product_id = ${id}`;
    const r = await buildOptions(sql, id, def, stock);
    console.log(`  ${def.slug}: ${r.groups} groups, ${r.variants} variants`);
  }
  console.log("done");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
