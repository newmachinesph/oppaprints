import { neon } from "@neondatabase/serverless";

// Server-only. DATABASE_URL never reaches the client bundle.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Parameterized tagged-template queries over HTTP. Safe against injection.
export const sql = neon(process.env.DATABASE_URL);
