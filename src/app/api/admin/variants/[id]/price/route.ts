import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// Update a variant's price override. null → fall back to the product base price.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as { priceCents?: number | null };
  const priceCents =
    body.priceCents === null || body.priceCents === undefined ? null : Number(body.priceCents);
  if (priceCents !== null && (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 100_000_00)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  await sql`UPDATE variants SET price_cents = ${priceCents} WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true, priceCents });
}
