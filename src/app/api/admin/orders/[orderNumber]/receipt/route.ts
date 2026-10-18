import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getObject } from "@/lib/r2";
import type { Order } from "@/lib/types";

// Private: only an authenticated admin can view a customer's payment receipt.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const { orderNumber } = await params;
  const rows = (await sql`SELECT receipt_key FROM orders WHERE order_number = ${orderNumber}`) as Pick<
    Order,
    "receipt_key"
  >[];
  const key = rows[0]?.receipt_key;
  if (!key) return new NextResponse("No receipt", { status: 404 });

  const obj = await getObject(key);
  if (!obj) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(obj.body), {
    headers: { "Content-Type": obj.contentType, "Cache-Control": "private, no-store" },
  });
}
