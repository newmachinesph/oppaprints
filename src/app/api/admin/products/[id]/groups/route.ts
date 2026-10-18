import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { OptionGroup } from "@/lib/types";

// Add an option group (e.g. "Size", "Color", "Name") to a product. Position is
// appended, so groups render in the order they were created (the hierarchy).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const productId = Number((await params).id);
  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  const label = (name ?? "").trim();
  if (!label) return NextResponse.json({ error: "Group name is required" }, { status: 400 });

  const [{ pos }] = (await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM option_groups WHERE product_id = ${productId}
  `) as { pos: number }[];
  const rows = (await sql`
    INSERT INTO option_groups (product_id, name, position) VALUES (${productId}, ${label}, ${pos})
    RETURNING *
  `) as OptionGroup[];
  return NextResponse.json({ group: { ...rows[0], values: [] } });
}
