// Full seed: schema + R2 image upload + 15 products with flexible option model.
// Run: npm run seed  (drops & recreates all tables — dev use)
import { config } from "dotenv";
config({ path: process.env.ENV_FILE ?? ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { toWebp } from "../src/lib/images.ts";
import { PRODUCTS, CATEGORY, buildOptions } from "./catalog.ts";

const sql = neon(process.env.DATABASE_URL!);
const BUCKET = process.env.R2_BUCKET!;
const PREFIX = process.env.R2_PREFIX || "";
const withPrefix = (k: string) => (PREFIX ? `${PREFIX}/${k}` : k);
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function putObject(key: string, body: Buffer, ct: string) {
  await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: ct }));
}
async function ensureBucket() {
  try {
    await r2.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`created bucket ${BUCKET}`);
  } catch (e: unknown) {
    console.log(`ensureBucket: ${(e as { name?: string })?.name} (continuing)`);
  }
}

async function ddl() {
  await sql`DROP TABLE IF EXISTS order_items CASCADE`;
  await sql`DROP TABLE IF EXISTS orders CASCADE`;
  await sql`DROP TABLE IF EXISTS product_images CASCADE`;
  await sql`DROP TABLE IF EXISTS variant_options CASCADE`;
  await sql`DROP TABLE IF EXISTS option_values CASCADE`;
  await sql`DROP TABLE IF EXISTS option_groups CASCADE`;
  await sql`DROP TABLE IF EXISTS variants CASCADE`;
  await sql`DROP TABLE IF EXISTS products CASCADE`;
  await sql`DROP TABLE IF EXISTS customers CASCADE`;

  await sql`CREATE TABLE products (
    id serial PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    price_cents int NOT NULL,
    category text,
    text_upcharge_cents int NOT NULL DEFAULT 0,
    has_color boolean NOT NULL DEFAULT false,
    has_size boolean NOT NULL DEFAULT false,
    has_text boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE variants (
    id serial PRIMARY KEY,
    product_id int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku text UNIQUE NOT NULL,
    price_cents int,
    stock int NOT NULL DEFAULT 0,
    weight_grams int NOT NULL DEFAULT 0,
    image_key text
  )`;

  await sql`CREATE TABLE option_groups (
    id serial PRIMARY KEY,
    product_id int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name text NOT NULL,
    position int NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE option_values (
    id serial PRIMARY KEY,
    group_id int NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    label text NOT NULL,
    position int NOT NULL DEFAULT 0,
    hex text
  )`;
  await sql`CREATE TABLE variant_options (
    variant_id int NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    group_id int NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    value_id int NOT NULL REFERENCES option_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, group_id)
  )`;

  await sql`CREATE TABLE product_images (
    id serial PRIMARY KEY,
    product_id int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    key text NOT NULL,
    sort int NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false
  )`;

  await sql`CREATE TABLE customers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    phone text UNIQUE NOT NULL,
    email text,
    address text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE orders (
    id serial PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_id int NOT NULL REFERENCES customers(id),
    status text NOT NULL DEFAULT 'pending',
    subtotal_cents int NOT NULL,
    receipt_key text,
    payment_method text,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE order_items (
    id serial PRIMARY KEY,
    order_id int NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id int NOT NULL,
    variant_id int,
    product_name text NOT NULL,
    options jsonb,
    qty int NOT NULL,
    unit_price_cents int NOT NULL
  )`;
  console.log("schema created");
}

async function uploadImages(): Promise<string[]> {
  const dir = path.resolve("product-images");
  if (!fs.existsSync(dir)) {
    console.log("product-images/ not present — skipping upload (images already in R2)");
    return [];
  }
  const files = fs.readdirSync(dir).filter((f) => /\.hei[cf]$/i.test(f)).sort();
  const keys: string[] = [];
  for (const f of files) {
    const webp = await toWebp(fs.readFileSync(path.join(dir, f)), "image/heic");
    const key = withPrefix(`products/${randomUUID()}.webp`);
    await putObject(key, webp, "image/webp");
    keys.push(key);
    console.log(`uploaded ${f} -> ${key} (${Math.round(webp.length / 1024)}kb)`);
  }
  return keys;
}

function planImageCounts(total: number, products: number): number[] {
  const base = Math.floor(total / products);
  let extra = total - base * products;
  return Array.from({ length: products }, () => base + (extra-- > 0 ? 1 : 0));
}

async function main() {
  if (process.env.SCHEMA_ONLY) {
    await ddl();
    console.log("schema-only: tables created, no products, no R2");
    process.exit(0);
  }
  await ensureBucket();
  await ddl();

  const keys = await uploadImages();
  const counts = planImageCounts(keys.length, PRODUCTS.length);
  const stock = { n: 0 };
  let ki = 0;

  for (let i = 0; i < PRODUCTS.length; i++) {
    const def = PRODUCTS[i];
    const [row] = (await sql`
      INSERT INTO products (slug, name, description, price_cents, category, text_upcharge_cents)
      VALUES (${def.slug}, ${def.name}, ${def.description}, ${def.price},
              ${CATEGORY[def.slug] ?? null}, ${def.textUpcharge})
      RETURNING id`) as { id: number }[];
    const pid = row.id;

    const n = counts[i];
    const imgInserts = [];
    for (let j = 0; j < n; j++) {
      imgInserts.push(sql`
        INSERT INTO product_images (product_id, key, sort, is_primary)
        VALUES (${pid}, ${keys[ki++]}, ${j}, ${j === 0})`);
    }
    if (imgInserts.length) await sql.transaction(imgInserts);

    const r = await buildOptions(sql, pid, def, stock);
    console.log(`product ${def.slug}: ${r.groups} groups, ${r.variants} variants, ${n} images`);
  }

  console.log(`\nDone. ${PRODUCTS.length} products seeded.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
