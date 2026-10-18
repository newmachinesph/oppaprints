import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { deleteObject } from "@/lib/r2";
import type { ProductImage } from "@/lib/types";

// Edit a product's basic fields (name, description, price, dimensions, active).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  const b = (await req.json().catch(() => ({}))) as {
    name?: string;
    slug?: string;
    description?: string;
    priceCents?: number;
    category?: string;
    hasColor?: boolean;
    hasSize?: boolean;
    hasText?: boolean;
    textUpchargeCents?: number;
    active?: boolean;
  };

  const name = (b.name ?? "").trim();
  const price = Number(b.priceCents);
  const category = (b.category ?? "").trim() || null;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!Number.isInteger(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  const upcharge = Number.isInteger(Number(b.textUpchargeCents)) ? Number(b.textUpchargeCents) : 0;

  // Slug only changes when the admin edits the field; deduped so it never collides.
  const rawSlug = (b.slug ?? "").trim();
  let slug: string | undefined;
  if (rawSlug) {
    slug = await uniqueSlug(rawSlug, id);
    await sql`UPDATE products SET slug = ${slug} WHERE id = ${id}`;
  }

  await sql`
    UPDATE products SET
      name = ${name},
      description = ${(b.description ?? "").trim()},
      price_cents = ${price},
      category = ${category},
      text_upcharge_cents = ${upcharge},
      has_color = ${!!b.hasColor},
      has_size = ${!!b.hasSize},
      has_text = ${!!b.hasText},
      active = ${b.active === undefined ? true : !!b.active}
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true, slug });
}

// Delete a product: remove its R2 images, then the rows (variants/images
// cascade). Past orders keep their snapshots.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);

  const images = (await sql`SELECT key FROM product_images WHERE product_id = ${id}`) as Pick<
    ProductImage,
    "key"
  >[];
  for (const img of images) {
    try {
      await deleteObject(img.key);
    } catch {
      // best-effort; keep deleting the rest
    }
  }
  await sql`DELETE FROM products WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
