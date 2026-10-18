"use client";

import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
    >
      Sign out
    </button>
  );
}
