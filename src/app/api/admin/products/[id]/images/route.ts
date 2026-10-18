import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { putObject, withPrefix } from "@/lib/r2";
import { toWebp, isImageMime } from "@/lib/images";
import type { ProductImage } from "@/lib/types";

// Admin adds an image to a product (HEIC/JPG/PNG → resized WebP in R2).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const productId = Number((await params).id);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!isImageMime(file.type)) return NextResponse.json({ error: "Not an image" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Too large" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const webp = await toWebp(buf, file.type);
  const key = withPrefix(`products/${randomUUID()}.webp`);
  await putObject(key, webp, "image/webp");

  const agg = (await sql`
    SELECT COUNT(*)::int AS n, COALESCE(MAX(sort), -1) AS maxsort
    FROM product_images WHERE product_id = ${productId}
  `) as { n: number; maxsort: number }[];
  const first = agg[0].n === 0;

  const rows = (await sql`
    INSERT INTO product_images (product_id, key, sort, is_primary)
    VALUES (${productId}, ${key}, ${agg[0].maxsort + 1}, ${first})
    RETURNING *
  `) as ProductImage[];

  return NextResponse.json({ image: rows[0] });
}
