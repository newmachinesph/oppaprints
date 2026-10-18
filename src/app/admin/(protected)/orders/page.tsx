import Link from "next/link";
import { adminOrders } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/config";

export default async function AdminOrdersPage() {
  const orders = await adminOrders();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left dark:bg-white/5">
            <tr>
              <th className="px-4 py-2.5 font-medium">Order</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Phone</th>
              <th className="px-4 py-2.5 font-medium">Total</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_number} className="border-t border-black/5 dark:border-white/5">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/orders/${o.order_number}`} className="font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{o.customer_name}</td>
                <td className="px-4 py-2.5">{o.customer_phone}</td>
                <td className="px-4 py-2.5">{formatCents(o.subtotal_cents)}</td>
                <td className="px-4 py-2.5">
                  {o.receipt_key && o.status === "awaiting_review" && (
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />
                  )}
                  {STATUS_LABEL[o.status]}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-black/50">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
