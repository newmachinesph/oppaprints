// Server-only settings backed by the key/value `settings` table.
// VAT math (rate, vatCents) lives in config.ts so client code can share it.
import { sql } from "./db";

// Boolean flags default to true when unset.
async function getFlag(key: string): Promise<boolean> {
  const rows = (await sql`SELECT value FROM settings WHERE key = ${key}`) as { value: string }[];
  return rows[0]?.value !== "false";
}

async function setFlag(key: string, enabled: boolean): Promise<void> {
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${enabled ? "true" : "false"})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export const getVatEnabled = () => getFlag("vat_enabled");
export const setVatEnabled = (v: boolean) => setFlag("vat_enabled", v);
export const getCodEnabled = () => getFlag("cod_enabled");
export const setCodEnabled = (v: boolean) => setFlag("cod_enabled", v);
