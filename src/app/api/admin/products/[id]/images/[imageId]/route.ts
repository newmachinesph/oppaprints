import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { deleteObject } from "@/lib/r2";
import type { ProductImage } from "@/lib/types";

// PATCH → make this image the primary. DELETE → remove image + R2 object.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, imageId } = await params;
  const productId = Number(id);
  await sql.transaction([
    sql`UPDATE product_images SET is_primary = false WHERE product_id = ${productId}`,
    sql`UPDATE product_images SET is_primary = true WHERE id = ${Number(imageId)} AND product_id = ${productId}`,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, imageId } = await params;
  const productId = Number(id);

  const rows = (await sql`
    SELECT * FROM product_images WHERE id = ${Number(imageId)} AND product_id = ${productId}
  `) as ProductImage[];
  const img = rows[0];
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteObject(img.key);
  await sql`DELETE FROM product_images WHERE id = ${img.id}`;

  // If we removed the primary, promote the next image.
  if (img.is_primary) {
    await sql`
      UPDATE product_images SET is_primary = true
      WHERE id = (SELECT id FROM product_images WHERE product_id = ${productId} ORDER BY sort ASC LIMIT 1)
    `;
  }
  return NextResponse.json({ ok: true });
}
