import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCodEnabled } from "@/lib/settings";
import type { Order } from "@/lib/types";

// Customer opts into Cash on Delivery instead of paying via QR. Authorized by
// the phone on the order. No receipt needed — admin collects on delivery.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = (body.phone ?? "").trim();
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });
  if (!(await getCodEnabled())) {
    return NextResponse.json({ error: "Cash on Delivery is unavailable" }, { status: 403 });
  }

  const rows = (await sql`
    SELECT o.* FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.order_number = ${orderNumber} AND c.phone = ${phone}
  `) as Order[];
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid" || order.status === "fulfilled") {
    return NextResponse.json({ error: "This order is already settled" }, { status: 409 });
  }

  await sql`
    UPDATE orders SET payment_method = 'cod', status = 'awaiting_review'
    WHERE id = ${order.id}
  `;
  return NextResponse.json({ ok: true });
}
