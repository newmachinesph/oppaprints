import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/r2";

// Public proxy for PRODUCT images only. Keeps R2 credentials server-side and
// avoids needing a public bucket. Receipts are private (served via admin route).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");

  // Only product images are public. Never serve receipts or arbitrary keys.
  if (!key.includes("products/") || key.includes("receipts/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const obj = await getObject(key);
  if (!obj) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(obj.body), {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
