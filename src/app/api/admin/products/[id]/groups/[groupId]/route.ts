import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// Delete a group. Removing a dimension invalidates every combination, so all of
// the product's variants are cleared too (admin re-adds combos afterward).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, groupId } = await params;
  await sql`DELETE FROM variants WHERE product_id = ${Number(id)}`;
  await sql`DELETE FROM option_groups WHERE id = ${Number(groupId)} AND product_id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
