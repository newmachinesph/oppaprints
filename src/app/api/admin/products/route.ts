import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import type { Product } from "@/lib/types";

// Admin creates a new product. Variants + images are added afterward on the
// product page (via VariantManager / ImageManager).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  };

  const name = (b.name ?? "").trim();
  const slug = await uniqueSlug(b.slug || name);
  const price = Number(b.priceCents);
  const category = (b.category ?? "").trim() || null;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "Could not derive a slug from the name" }, { status: 400 });
  if (!Number.isInteger(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  const upcharge = Number.isInteger(Number(b.textUpchargeCents)) ? Number(b.textUpchargeCents) : 0;

  try {
    const rows = (await sql`
      INSERT INTO products (slug, name, description, price_cents, category, text_upcharge_cents, has_color, has_size, has_text)
      VALUES (${slug}, ${name}, ${(b.description ?? "").trim()}, ${price}, ${category}, ${upcharge},
              ${!!b.hasColor}, ${!!b.hasSize}, ${!!b.hasText})
      RETURNING *
    `) as Product[];
    return NextResponse.json({ product: rows[0] });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "23505" || String(e).includes("duplicate")) {
      return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 });
    }
    throw e;
  }
}
