import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { putObject, deleteObject, withPrefix } from "@/lib/r2";
import { toWebp, isImageMime } from "@/lib/images";
import type { Variant } from "@/lib/types";

// Set (or replace) the image for a specific variant/combination.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const variantId = Number((await params).id);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!isImageMime(file.type)) return NextResponse.json({ error: "Not an image" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Too large" }, { status: 400 });

  const rows = (await sql`SELECT image_key FROM variants WHERE id = ${variantId}`) as Pick<
    Variant,
    "image_key"
  >[];
  if (!rows[0]) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  const webp = await toWebp(Buffer.from(await file.arrayBuffer()), file.type);
  const key = withPrefix(`products/${randomUUID()}.webp`);
  await putObject(key, webp, "image/webp");
  if (rows[0].image_key) {
    try {
      await deleteObject(rows[0].image_key);
    } catch {
      /* best effort */
    }
  }
  await sql`UPDATE variants SET image_key = ${key} WHERE id = ${variantId}`;
  return NextResponse.json({ image_key: key });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const variantId = Number((await params).id);
  const rows = (await sql`SELECT image_key FROM variants WHERE id = ${variantId}`) as Pick<
    Variant,
    "image_key"
  >[];
  if (rows[0]?.image_key) {
    try {
      await deleteObject(rows[0].image_key);
    } catch {
      /* best effort */
    }
  }
  await sql`UPDATE variants SET image_key = NULL WHERE id = ${variantId}`;
  return NextResponse.json({ ok: true });
}
