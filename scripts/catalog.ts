// Shared catalog definitions + option-model builder. Used by seed.ts and
// build-options.ts so the flexible option taxonomy is generated one way.
import { randomBytes } from "node:crypto";
import type { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

export const TEXT_VALUES = [
  "Plain Box (No Text)",
  "Outer Text Only",
  "Inner Text Only",
  "Outer and Inner Text",
];
export const STOCK_CYCLE = [25, 40, 12, 3, 30, 50, 8, 18, 5, 22];

// Storefront category per product (by slug). Admin can change it later.
export const CATEGORY: Record<string, string> = {
  "uv-dtf-sticker": "Glassware & Drinkware",
  "tissue-paper-set": "Paper Supplies",
  "kraft-mailer-box": "Paper Supplies",
  "mini-trinket-box": "Arts & Crafts",
  "magnetic-flap-box": "Arts & Crafts",
  "drawer-box": "Home Decor",
  "pillow-box": "Home Decor",
  "rigid-keepsake-box": "Home Decor",
  "classic-gift-box": "Packaging & Wrapping",
  "shipping-box": "Packaging & Wrapping",
  "custom-cake-box": "Packaging & Wrapping",
  "personalized-hamper-box": "Packaging & Wrapping",
  "wedding-favor-box": "Packaging & Wrapping",
  "corporate-gift-box": "Packaging & Wrapping",
  "birthday-surprise-box": "Packaging & Wrapping",
};

export type ProductDef = {
  slug: string;
  name: string;
  description: string;
  price: number;
  textUpcharge: number;
  colors: string[] | null;
  sizes: string[] | null;
  hasText: boolean;
};

export const PRODUCTS: ProductDef[] = [
  { slug: "uv-dtf-sticker", name: "UV DTF Sticker", description: "Waterproof UV DTF transfer stickers on a full sheet. Peel, stick, and press onto mugs, tumblers, and hard surfaces. Sold per sheet.", price: 12000, textUpcharge: 0, colors: null, sizes: ["A5 sheet (4x11 inch)", "A4 sheet (8x11 inch)", "A3 sheet (11x16 inch)"], hasText: false },
  { slug: "mini-trinket-box", name: "Mini Trinket Box", description: "Compact keepsake box for jewelry and small gifts. Sturdy matte finish.", price: 8900, textUpcharge: 0, colors: ["Beige", "White", "Black", "Pink", "Gold"], sizes: null, hasText: false },
  { slug: "tissue-paper-set", name: "Tissue Paper Set", description: "Pack of 20 acid-free tissue sheets to cushion and dress up any package.", price: 5900, textUpcharge: 0, colors: ["White", "Pink", "Lavender", "Sky Blue"], sizes: null, hasText: false },
  { slug: "kraft-mailer-box", name: "Kraft Mailer Box", description: "Self-locking corrugated mailer, ready for shipping. No tape needed.", price: 7500, textUpcharge: 0, colors: ["Beige", "Black", "White"], sizes: null, hasText: false },
  { slug: "magnetic-flap-box", name: "Magnetic Flap Box", description: "Premium rigid box with a magnetic closure. Reusable and gift-ready.", price: 18900, textUpcharge: 0, colors: ["Black", "White", "Navy Blue", "Gold"], sizes: null, hasText: false },
  { slug: "classic-gift-box", name: "Classic Gift Box", description: "The everyday lid-and-base gift box. Clean, sturdy, endlessly useful.", price: 14900, textUpcharge: 0, colors: ["Beige", "White", "Black", "Pink", "Lavender"], sizes: ["Small", "Large"], hasText: false },
  { slug: "rigid-keepsake-box", name: "Rigid Keepsake Box", description: "Heavy rigid board box built to last. For the gifts worth keeping.", price: 24900, textUpcharge: 0, colors: ["Black", "Navy Blue", "Gold"], sizes: ["Small", "Large"], hasText: false },
  { slug: "drawer-box", name: "Drawer Box", description: "Slide-out drawer box with a soft push-pull action. A tactile unboxing.", price: 19900, textUpcharge: 0, colors: ["White", "Beige", "Pastel Blue"], sizes: ["Small", "Large"], hasText: false },
  { slug: "pillow-box", name: "Pillow Box", description: "Curved pillow box for accessories, scarves, and soft goods.", price: 6900, textUpcharge: 0, colors: ["Pink", "Lavender", "Sky Blue", "Orange"], sizes: ["Small", "Large"], hasText: false },
  { slug: "shipping-box", name: "Shipping Box", description: "Double-wall shipping box that keeps fragile orders safe in transit.", price: 9900, textUpcharge: 0, colors: ["Beige", "White"], sizes: ["Small", "Large"], hasText: false },
  { slug: "custom-cake-box", name: "Custom Cake Box", description: "Food-safe cake box with a window option. Add your bakery name or greeting.", price: 15900, textUpcharge: 5000, colors: ["White", "Pink", "Beige"], sizes: ["Small", "Large"], hasText: true },
  { slug: "personalized-hamper-box", name: "Personalized Hamper Box", description: "Large hamper box for curated gift sets. Print outer and inner messages.", price: 32900, textUpcharge: 6000, colors: ["Black", "Gold", "Navy Blue"], sizes: ["Small", "Large"], hasText: true },
  { slug: "wedding-favor-box", name: "Wedding Favor Box", description: "Elegant favor box for the big day. Add names, dates, or a thank-you note.", price: 8900, textUpcharge: 4000, colors: ["White", "Beige", "Lavender", "Gold"], sizes: ["Small", "Large"], hasText: true },
  { slug: "corporate-gift-box", name: "Corporate Gift Box", description: "Branded gift box for clients and staff. Print your logo text inside and out.", price: 27900, textUpcharge: 6000, colors: ["Black", "Navy Blue", "White"], sizes: ["Small", "Large"], hasText: true },
  { slug: "birthday-surprise-box", name: "Birthday Surprise Box", description: "Playful birthday box. Personalize the name on the outside and a note inside.", price: 12900, textUpcharge: 4000, colors: ["Pink", "Sky Blue", "Orange", "Red"], sizes: ["Small", "Large"], hasText: true },
];

const sku = (slug: string) => `${slug.toUpperCase().slice(0, 20)}-${randomBytes(3).toString("hex")}`;

// Build ordered option groups (Size -> Color -> Name), their values, and one
// variant per combination (with per-combination stock + text upcharge price).
export async function buildOptions(
  sql: Sql,
  productId: number,
  def: ProductDef,
  stock: { n: number },
): Promise<{ groups: number; variants: number }> {
  const defs: { name: string; values: string[] }[] = [];
  if (def.sizes) defs.push({ name: "Size", values: def.sizes });
  if (def.colors) defs.push({ name: "Color", values: def.colors });
  if (def.hasText) defs.push({ name: "Name", values: TEXT_VALUES });

  const built: { groupId: number; name: string; values: { id: number; label: string }[] }[] = [];
  for (let gi = 0; gi < defs.length; gi++) {
    const [g] = (await sql`
      INSERT INTO option_groups (product_id, name, position) VALUES (${productId}, ${defs[gi].name}, ${gi})
      RETURNING id`) as { id: number }[];
    const values = [];
    for (let vi = 0; vi < defs[gi].values.length; vi++) {
      const [v] = (await sql`
        INSERT INTO option_values (group_id, label, position) VALUES (${g.id}, ${defs[gi].values[vi]}, ${vi})
        RETURNING id`) as { id: number }[];
      values.push({ id: v.id, label: defs[gi].values[vi] });
    }
    built.push({ groupId: g.id, name: defs[gi].name, values });
  }

  let combos: { groupId: number; name: string; valueId: number; label: string }[][] = [[]];
  for (const g of built) {
    const next: typeof combos = [];
    for (const combo of combos) {
      for (const v of g.values) {
        next.push([...combo, { groupId: g.groupId, name: g.name, valueId: v.id, label: v.label }]);
      }
    }
    combos = next;
  }

  for (const combo of combos) {
    const nameVal = combo.find((c) => c.name === "Name")?.label ?? null;
    const price =
      def.hasText && nameVal && nameVal !== TEXT_VALUES[0] ? def.price + def.textUpcharge : null;
    const st = STOCK_CYCLE[stock.n++ % STOCK_CYCLE.length];
    const [nv] = (await sql`
      INSERT INTO variants (product_id, price_cents, stock, sku)
      VALUES (${productId}, ${price}, ${st}, ${sku(def.slug)})
      RETURNING id`) as { id: number }[];
    for (const c of combo) {
      await sql`INSERT INTO variant_options (variant_id, group_id, value_id)
        VALUES (${nv.id}, ${c.groupId}, ${c.valueId})`;
    }
  }
  return { groups: built.length, variants: combos.length };
}
