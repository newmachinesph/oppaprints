import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { normalizeHex } from "@/lib/config";

// Update a value's swatch colour.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ valueId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const valueId = Number((await params).valueId);
  const { hex } = (await req.json().catch(() => ({}))) as { hex?: string };
  const color = normalizeHex(hex);
  if (color === false) return NextResponse.json({ error: "Invalid colour" }, { status: 400 });
  await sql`UPDATE option_values SET hex = ${color} WHERE id = ${valueId}`;
  return NextResponse.json({ ok: true, hex: color });
}

// Delete a value. Any variant (combination) using it is removed too.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ valueId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const valueId = Number((await params).valueId);
  await sql`
    DELETE FROM variants WHERE id IN (SELECT variant_id FROM variant_options WHERE value_id = ${valueId})
  `;
  await sql`DELETE FROM option_values WHERE id = ${valueId}`;
  return NextResponse.json({ ok: true });
}
