import { sql } from "@/lib/db";

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// Returns a slug free of collisions. If `base` is taken, appends -2, -3, …
// Pass excludeId when editing so a product doesn't collide with itself.
export async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const clean = slugify(base) || "product";
  let candidate = clean;
  for (let i = 2; i < 1000; i++) {
    const rows = (await sql`
      SELECT 1 FROM products WHERE slug = ${candidate} AND id <> ${excludeId ?? -1} LIMIT 1
    `) as unknown[];
    if (rows.length === 0) return candidate;
    candidate = `${clean}-${i}`;
  }
  return `${clean}-${Date.now()}`;
}

// ponytail: linear scan to 1000 is plenty for an admin catalog; make it a
// count-then-suffix query if a product ever needs thousands of variants.
