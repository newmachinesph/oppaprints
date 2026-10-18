import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { STORE_NAME } from "@/lib/config";
import AdminLogout from "@/components/AdminLogout";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products & stock" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-black/10 pb-4 dark:border-white/10">
        <Link href="/admin" className="font-semibold tracking-tight">
          {STORE_NAME} Admin
        </Link>
        <nav className="flex gap-4 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
            View store ↗
          </Link>
          <AdminLogout />
        </div>
      </header>
      <div className="py-6">{children}</div>
    </div>
  );
}
