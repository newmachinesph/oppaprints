// Minimal self-check for the money path. Run: npx tsx scripts/check-pricing.ts
import assert from "node:assert";
import { unitPriceCents } from "../src/lib/pricing.ts";
import { TEXT_OPTIONS } from "../src/lib/config.ts";

const P = { price_cents: 10000, text_upcharge_cents: 5000, has_text: false };
const PT = { ...P, has_text: true };

// base price when no override / no text
assert.equal(unitPriceCents(P, { price_cents: null }, null), 10000);
// variant price override wins over base
assert.equal(unitPriceCents(P, { price_cents: 12000 }, null), 12000);
// plain text option adds no upcharge
assert.equal(unitPriceCents(PT, { price_cents: null }, TEXT_OPTIONS[0]), 10000);
// non-plain text option adds the upcharge
assert.equal(unitPriceCents(PT, { price_cents: null }, "Outer Text Only"), 15000);
// upcharge only applies when product actually has text
assert.equal(unitPriceCents(P, { price_cents: null }, "Outer Text Only"), 10000);

console.log("pricing OK");
