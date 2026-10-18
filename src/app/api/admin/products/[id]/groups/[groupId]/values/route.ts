import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { normalizeHex } from "@/lib/config";
import type { OptionValue } from "@/lib/types";

// Add a value to a group (e.g. a new color "Teal"). Doesn't affect existing
// variants — the admin then adds combinations that use it.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const groupId = Number((await params).groupId);
  const { label, hex } = (await req.json().catch(() => ({}))) as { label?: string; hex?: string };
  const text = (label ?? "").trim();
  if (!text) return NextResponse.json({ error: "Value is required" }, { status: 400 });
  const color = normalizeHex(hex);
  if (color === false) return NextResponse.json({ error: "Invalid colour" }, { status: 400 });

  const [{ pos }] = (await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM option_values WHERE group_id = ${groupId}
  `) as { pos: number }[];
  const rows = (await sql`
    INSERT INTO option_values (group_id, label, position, hex)
    VALUES (${groupId}, ${text}, ${pos}, ${color})
    RETURNING *
  `) as OptionValue[];
  return NextResponse.json({ value: rows[0] });
}
