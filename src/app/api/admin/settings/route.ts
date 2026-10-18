import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { setVatEnabled, setCodEnabled } from "@/lib/settings";

// Admin toggles store settings (VAT and COD on/off). Send either flag.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { vatEnabled?: boolean; codEnabled?: boolean };
  if (typeof body.vatEnabled === "boolean") await setVatEnabled(body.vatEnabled);
  if (typeof body.codEnabled === "boolean") await setCodEnabled(body.codEnabled);
  if (body.vatEnabled === undefined && body.codEnabled === undefined) {
    return NextResponse.json({ error: "No setting provided" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
