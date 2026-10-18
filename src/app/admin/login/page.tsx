"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORE_NAME } from "@/lib/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <h1 className="text-2xl font-semibold tracking-tight">{STORE_NAME} Admin</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">Staff login</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm dark:border-white/20"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm dark:border-white/20"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          disabled={busy}
          className="rounded-full bg-black py-3 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
