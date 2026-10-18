import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { unitPriceCents } from "@/lib/pricing";
import { shippingCents, isRegion } from "@/lib/shipping";
import { vatCents } from "@/lib/config";
import { getVatEnabled } from "@/lib/settings";
import type { SelectedOption } from "@/lib/types";

type ItemIn = { variantId: number; qty: number };

function orderNumber(): string {
  return `OPP-${randomBytes(4).readUInt32BE(0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
}

const bad = (msg: string, code = 400) => NextResponse.json({ error: msg }, { status: code });

export async function POST(req: NextRequest) {
  let body: {
    customer?: { name?: string; phone?: string; email?: string; address?: string };
    items?: ItemIn[];
    note?: string;
    region?: string;
  };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const c = body.customer ?? {};
  const name = (c.name ?? "").trim();
  const phone = (c.phone ?? "").trim();
  const address = (c.address ?? "").trim() || null;
  const email = (c.email ?? "").trim() || null;
  const note = (body.note ?? "").trim() || null;
  const items = Array.isArray(body.items) ? body.items : [];
  const region = body.region;

  if (!name || !phone) return bad("Name and phone are required");
  if (!isRegion(region)) return bad("Please select a delivery region");
  if (!items.length) return bad("Cart is empty");
  for (const it of items) {
    if (!Number.isInteger(it.variantId) || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 999) {
      return bad("Invalid cart item");
    }
  }

  const ids = items.map((i) => i.variantId);
  const rows = (await sql`
    SELECT v.id AS vid, v.stock, v.price_cents AS vprice, v.weight_grams,
           p.id AS pid, p.name AS pname, p.price_cents
    FROM variants v JOIN products p ON p.id = v.product_id
    WHERE v.id = ANY(${ids})
  `) as {
    vid: number; stock: number; vprice: number | null; weight_grams: number;
    pid: number; pname: string; price_cents: number;
  }[];
  const byId = new Map(rows.map((r) => [r.vid, r]));

  // Snapshot each variant's chosen options (group + value), ordered.
  const optRows = ids.length
    ? ((await sql`
        SELECT vo.variant_id, og.name AS group, ov.label AS value, og.position
        FROM variant_options vo
        JOIN option_groups og ON og.id = vo.group_id
        JOIN option_values ov ON ov.id = vo.value_id
        WHERE vo.variant_id = ANY(${ids})
        ORDER BY og.position, og.id
      `) as { variant_id: number; group: string; value: string; position: number }[])
    : [];
  const optionsFor = (vid: number): SelectedOption[] =>
    optRows.filter((o) => o.variant_id === vid).map((o) => ({ group: o.group, value: o.value }));

  const lines = [];
  for (const it of items) {
    const v = byId.get(it.variantId);
    if (!v) return bad(`An item in your cart is no longer available`);
    if (v.stock < it.qty) {
      const opts = optionsFor(v.vid).map((o) => o.value).join(" / ") || "default";
      return bad(`${v.pname} (${opts}) has only ${v.stock} left`, 409);
    }
    const unit = unitPriceCents({ price_cents: v.price_cents }, { price_cents: v.vprice });
    lines.push({ pid: v.pid, vid: v.vid, pname: v.pname, options: optionsFor(v.vid), qty: it.qty, unit, weight: v.weight_grams });
  }

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const totalWeight = lines.reduce((s, l) => s + l.qty * (l.weight ?? 0), 0);
  const shipping = shippingCents(totalWeight, region);
  const vat = vatCents(subtotal, await getVatEnabled());

  const custRows = (await sql`
    INSERT INTO customers (name, phone, email, address)
    VALUES (${name}, ${phone}, ${email}, ${address})
    ON CONFLICT (phone) DO UPDATE SET
      name = EXCLUDED.name, email = EXCLUDED.email, address = EXCLUDED.address
    RETURNING id
  `) as { id: number }[];
  const customerId = custRows[0].id;

  let orderId: number | null = null;
  let number = orderNumber();
  for (let attempt = 0; attempt < 2 && orderId === null; attempt++) {
    try {
      const r = (await sql`
        INSERT INTO orders (order_number, customer_id, subtotal_cents, region,
                            shipping_cents, vat_cents, weight_grams, note, status)
        VALUES (${number}, ${customerId}, ${subtotal}, ${region},
                ${shipping}, ${vat}, ${totalWeight}, ${note}, 'pending')
        RETURNING id
      `) as { id: number }[];
      orderId = r[0].id;
    } catch {
      number = orderNumber();
    }
  }
  if (orderId === null) return bad("Could not create order, try again", 500);

  try {
    const stmts = [
      ...lines.map(
        (l) => sql`
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, options, qty, unit_price_cents)
        VALUES (${orderId}, ${l.pid}, ${l.vid}, ${l.pname}, ${JSON.stringify(l.options)}::jsonb, ${l.qty}, ${l.unit})`,
      ),
      ...lines.map(
        (l) => sql`UPDATE variants SET stock = stock - ${l.qty} WHERE id = ${l.vid} AND stock >= ${l.qty}`,
      ),
    ];
    await sql.transaction(stmts);
  } catch (e) {
    await sql`DELETE FROM orders WHERE id = ${orderId}`;
    console.error("order items failed", e);
    return bad("Could not create order, try again", 500);
  }

  return NextResponse.json({ orderNumber: number });
}
