import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Server-only admin session. Signed cookie, no DB session table.
const COOKIE = "opp_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const secret = () => process.env.SESSION_SECRET || "";

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken(): string {
  if (!secret()) throw new Error("SESSION_SECRET must be set");
  const payload = `admin.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  const payload = Buffer.from(b64, "base64url").toString();
  const expected = sign(payload);
  if (
    expected.length !== sig.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return false;
  }
  const issued = Number(payload.split(".")[1]);
  return Number.isFinite(issued) && Date.now() - issued < MAX_AGE * 1000;
}

export function checkCredentials(username: string, password: string): boolean {
  return (
    username === (process.env.ADMIN_USERNAME || "admin") &&
    password === process.env.ADMIN_PASSWORD &&
    !!process.env.ADMIN_PASSWORD
  );
}

export async function setAdminSession(): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return verifyToken(c.get(COOKIE)?.value);
}
