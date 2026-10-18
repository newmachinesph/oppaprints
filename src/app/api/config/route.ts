import { NextResponse } from "next/server";
import { getVatEnabled, getCodEnabled } from "@/lib/settings";

// Public store config for the checkout / payment UI. No secrets.
export async function GET() {
  const [vatEnabled, codEnabled] = await Promise.all([getVatEnabled(), getCodEnabled()]);
  return NextResponse.json({ vatEnabled, codEnabled });
}
