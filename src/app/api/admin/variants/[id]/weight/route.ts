import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// Update a variant's shipping weight. Caller sends already-converted grams.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as { weightGrams?: number };
  const weightGrams = Number(body.weightGrams);
  if (!Number.isInteger(weightGrams) || weightGrams < 0 || weightGrams > 100000) {
    return NextResponse.json({ error: "Invalid weight" }, { status: 400 });
  }
  await sql`UPDATE variants SET weight_grams = ${weightGrams} WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true, weightGrams });
}
