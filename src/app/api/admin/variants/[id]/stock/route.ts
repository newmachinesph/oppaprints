import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as { stock?: number };
  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }
  await sql`UPDATE variants SET stock = ${stock} WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true, stock });
}
