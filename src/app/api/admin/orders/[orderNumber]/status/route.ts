import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/config";

const RELEASED: OrderStatus[] = ["rejected", "cancelled"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderNumber } = await params;
  const body = (await req.json()) as { status?: string };
  const status = body.status as OrderStatus;
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const rows = (await sql`SELECT id, status FROM orders WHERE order_number = ${orderNumber}`) as {
    id: number;
    status: OrderStatus;
  }[];
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Return reserved stock to inventory the first time an order is released.
  const releasing = RELEASED.includes(status) && !RELEASED.includes(order.status);
  if (releasing) {
    const items = (await sql`
      SELECT variant_id, qty FROM order_items WHERE order_id = ${order.id} AND variant_id IS NOT NULL
    `) as { variant_id: number; qty: number }[];
    await sql.transaction([
      ...items.map(
        (it) => sql`UPDATE variants SET stock = stock + ${it.qty} WHERE id = ${it.variant_id}`,
      ),
      sql`UPDATE orders SET status = ${status} WHERE id = ${order.id}`,
    ]);
  } else {
    await sql`UPDATE orders SET status = ${status} WHERE id = ${order.id}`;
  }

  return NextResponse.json({ ok: true, status });
}
