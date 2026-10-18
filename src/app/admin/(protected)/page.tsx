import Link from "next/link";
import { sql } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { LOW_STOCK_THRESHOLD, STATUS_LABEL, type OrderStatus } from "@/lib/config";
import { getVatEnabled, getCodEnabled } from "@/lib/settings";
import SettingToggle from "@/components/admin/SettingToggle";

export default async function AdminDashboard() {
  const [vatEnabled, codEnabled] = await Promise.all([getVatEnabled(), getCodEnabled()]);
  const [stats] = (await sql`
    SELECT
      (SELECT COUNT(*) FROM products)::int AS products,
      (SELECT COUNT(*) FROM orders)::int AS orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'awaiting_review')::int AS to_review,
      (SELECT COUNT(*) FROM variants WHERE stock <= ${LOW_STOCK_THRESHOLD})::int AS low_stock,
      (SELECT COALESCE(SUM(subtotal_cents),0) FROM orders WHERE status IN ('paid','fulfilled'))::int AS revenue
  `) as {
    products: number;
    orders: number;
    to_review: number;
    low_stock: number;
    revenue: number;
  }[];

  const recent = (await sql`
    SELECT o.order_number, o.status, o.subtotal_cents, o.created_at, c.name
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC LIMIT 8
  `) as {
    order_number: string;
    status: OrderStatus;
    subtotal_cents: number;
    created_at: string;
    name: string;
  }[];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Products" value={stats.products} href="/admin/products" />
        <Stat label="Orders" value={stats.orders} href="/admin/orders" />
        <Stat label="To review" value={stats.to_review} href="/admin/orders" highlight={stats.to_review > 0} />
        <Stat label="Low stock" value={stats.low_stock} href="/admin/products" highlight={stats.low_stock > 0} />
        <Stat label="Revenue" value={formatCents(stats.revenue)} />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-medium">Settings</h2>
      <div className="flex flex-wrap gap-3">
        <SettingToggle
          field="vatEnabled"
          label="12% VAT"
          onText="Added to order subtotals"
          offText="Not charged"
          initial={vatEnabled}
        />
        <SettingToggle
          field="codEnabled"
          label="Cash on Delivery"
          onText="Offered at payment"
          offText="Hidden — QR only"
          initial={codEnabled}
        />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-medium">Recent orders</h2>
      <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left dark:bg-white/5">
            <tr>
              <Th>Order</Th><Th>Customer</Th><Th>Status</Th><Th>Total</Th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.order_number} className="border-t border-black/5 dark:border-white/5">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/orders/${o.order_number}`} className="font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{o.name}</td>
                <td className="px-4 py-2.5">{STATUS_LABEL[o.status]}</td>
                <td className="px-4 py-2.5">{formatCents(o.subtotal_cents)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-black/50">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: string | number;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
          : "border-black/10 dark:border-white/10"
      }`}
    >
      <p className="text-sm text-black/55 dark:text-white/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}
