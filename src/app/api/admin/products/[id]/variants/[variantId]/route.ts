import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// Admin deletes a variant. Past orders keep their own snapshot (order_items
// store product_name/color/size), so removing a variant is safe.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, variantId } = await params;
  await sql`DELETE FROM variants WHERE id = ${Number(variantId)} AND product_id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
