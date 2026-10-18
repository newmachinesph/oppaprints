import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Order } from "@/lib/types";

// Customer updates their delivery address for an order (before it ships).
// Authorized by the phone on the order.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  const body = (await req.json().catch(() => ({}))) as { phone?: string; address?: string };
  const phone = (body.phone ?? "").trim();
  const address = (body.address ?? "").trim();
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });
  if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 });

  const rows = (await sql`
    SELECT o.status, o.customer_id FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.order_number = ${orderNumber} AND c.phone = ${phone}
  `) as (Pick<Order, "status" | "customer_id">)[];
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "fulfilled") {
    return NextResponse.json({ error: "Order already fulfilled" }, { status: 409 });
  }

  await sql`UPDATE customers SET address = ${address} WHERE id = ${order.customer_id}`;
  return NextResponse.json({ ok: true, address });
}
