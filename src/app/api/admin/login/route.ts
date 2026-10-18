import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, setAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!checkCredentials(body.username ?? "", body.password ?? "")) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
