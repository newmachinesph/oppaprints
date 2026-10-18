import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Order, OrderItem } from "@/lib/types";

// Guest order tracking: authorize by order number + the phone on the order.
export async function POST(req: NextRequest) {
  let body: { orderNumber?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const orderNumber = (body.orderNumber ?? "").trim().toUpperCase();
  const phone = (body.phone ?? "").trim();
  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "Order number and phone required" }, { status: 400 });
  }

  const rows = (await sql`
    SELECT o.*, c.name AS customer_name, c.address AS customer_address
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.order_number = ${orderNumber} AND c.phone = ${phone}
  `) as (Order & { customer_name: string; customer_address: string | null })[];
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ error: "No matching order found" }, { status: 404 });
  }

  const items = (await sql`
    SELECT * FROM order_items WHERE order_id = ${order.id} ORDER BY id
  `) as OrderItem[];

  return NextResponse.json({
    order: {
      order_number: order.order_number,
      status: order.status,
      subtotal_cents: order.subtotal_cents,
      region: order.region,
      shipping_cents: order.shipping_cents,
      vat_cents: order.vat_cents,
      has_receipt: !!order.receipt_key,
      payment_method: order.payment_method,
      note: order.note,
      created_at: order.created_at,
      customer_name: order.customer_name,
      customer_address: order.customer_address,
    },
    items,
  });
}
