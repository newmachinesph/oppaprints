import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { Variant } from "@/lib/types";

// Admin adds a variant = one value per group + stock + optional price override.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const productId = Number((await params).id);

  const b = (await req.json().catch(() => ({}))) as {
    selections?: Record<string, number>;
    stock?: number;
    priceCents?: number | null;
    weightGrams?: number;
  };
  const selections = b.selections ?? {};
  const stock = Number(b.stock ?? 0);
  const weightGrams = Number(b.weightGrams ?? 0);
  const priceCents =
    b.priceCents === null || b.priceCents === undefined ? null : Number(b.priceCents);

  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }
  if (!Number.isInteger(weightGrams) || weightGrams < 0 || weightGrams > 100000) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }
  if (priceCents !== null && (!Number.isInteger(priceCents) || priceCents < 0)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const groups = (await sql`SELECT id FROM option_groups WHERE product_id = ${productId}`) as {
    id: number;
  }[];
  const groupIds = groups.map((g) => g.id).sort((a, z) => a - z);

  // Must choose exactly one value per group, each belonging to its group.
  const chosen = Object.entries(selections).map(([g, v]) => [Number(g), Number(v)] as const);
  if (chosen.length !== groupIds.length) {
    return NextResponse.json({ error: "Choose one value for every option" }, { status: 400 });
  }
  if (groupIds.length) {
    const values = (await sql`
      SELECT id, group_id FROM option_values WHERE group_id = ANY(${groupIds})
    `) as { id: number; group_id: number }[];
    for (const [gid, vid] of chosen) {
      if (!values.some((v) => v.id === vid && v.group_id === gid)) {
        return NextResponse.json({ error: "Invalid option selection" }, { status: 400 });
      }
    }
  }

  // Reject a duplicate combination.
  const existing = (await sql`
    SELECT vo.variant_id, vo.group_id, vo.value_id
    FROM variant_options vo JOIN variants v ON v.id = vo.variant_id
    WHERE v.product_id = ${productId}
  `) as { variant_id: number; group_id: number; value_id: number }[];
  const want = new Set(chosen.map(([g, v]) => `${g}:${v}`));
  const byVariant = new Map<number, Set<string>>();
  for (const o of existing) {
    if (!byVariant.has(o.variant_id)) byVariant.set(o.variant_id, new Set());
    byVariant.get(o.variant_id)!.add(`${o.group_id}:${o.value_id}`);
  }
  if (groupIds.length) {
    const dup = [...byVariant.values()].some(
      (s) => s.size === want.size && [...want].every((k) => s.has(k)),
    );
    if (dup) return NextResponse.json({ error: "That combination already exists" }, { status: 409 });
  } else {
    const [{ n }] = (await sql`SELECT COUNT(*)::int AS n FROM variants WHERE product_id = ${productId}`) as {
      n: number;
    }[];
    if (n > 0) return NextResponse.json({ error: "This product already has a variant" }, { status: 409 });
  }

  const sku = `${productId}-${randomBytes(3).toString("hex")}`;
  const rows = (await sql`
    INSERT INTO variants (product_id, price_cents, stock, weight_grams, sku)
    VALUES (${productId}, ${priceCents}, ${stock}, ${weightGrams}, ${sku})
    RETURNING id, product_id, sku, price_cents, stock, weight_grams, image_key
  `) as Omit<Variant, "options">[];
  const variantId = rows[0].id;
  for (const [gid, vid] of chosen) {
    await sql`INSERT INTO variant_options (variant_id, group_id, value_id) VALUES (${variantId}, ${gid}, ${vid})`;
  }
  return NextResponse.json({ variant: { ...rows[0], options: chosen.map(([g, v]) => ({ group_id: g, value_id: v })) } });
}
