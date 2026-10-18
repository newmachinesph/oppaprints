import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { putObject, withPrefix } from "@/lib/r2";
import { toWebp, isImageMime } from "@/lib/images";
import type { Order } from "@/lib/types";

// Customer uploads a payment receipt (image). Authorized by phone on the order.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  const form = await req.formData();
  const file = form.get("file");
  const phone = String(form.get("phone") ?? "").trim();

  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });
  if (!isImageMime(file.type)) {
    return NextResponse.json({ error: "Upload an image of your receipt" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 15MB)" }, { status: 400 });
  }

  const rows = (await sql`
    SELECT o.* FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.order_number = ${orderNumber} AND c.phone = ${phone}
  `) as Order[];
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid" || order.status === "fulfilled") {
    return NextResponse.json({ error: "This order is already paid" }, { status: 409 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const webp = await toWebp(buf, file.type);
  const key = withPrefix(`receipts/${orderNumber}-${Date.now()}.webp`);
  await putObject(key, webp, "image/webp");

  await sql`
    UPDATE orders SET receipt_key = ${key}, status = 'awaiting_review', payment_method = 'qr'
    WHERE id = ${order.id}
  `;

  return NextResponse.json({ ok: true });
}
