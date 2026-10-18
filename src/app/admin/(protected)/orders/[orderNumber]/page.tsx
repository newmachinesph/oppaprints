import Link from "next/link";
import { notFound } from "next/navigation";
import { orderByNumber } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import StatusControl from "@/components/admin/StatusControl";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await orderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-black/55 hover:underline dark:text-white/55">
        ← All orders
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{order.order_number}</h1>
      <p className="mt-1 text-sm text-black/55 dark:text-white/55">
        Payment:{" "}
        <span className="font-medium text-black dark:text-white">
          {order.payment_method === "cod"
            ? "Cash on Delivery"
            : order.payment_method === "qr"
              ? "GCash / BPI (receipt uploaded)"
              : "Not selected yet"}
        </span>
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-2 font-medium">Customer</h2>
            <p className="text-sm">{order.customer.name}</p>
            <p className="text-sm text-black/60 dark:text-white/60">{order.customer.phone}</p>
            {order.customer.email && (
              <p className="text-sm text-black/60 dark:text-white/60">{order.customer.email}</p>
            )}
            {order.customer.address && (
              <p className="mt-1 whitespace-pre-line text-sm text-black/60 dark:text-white/60">
                {order.customer.address}
              </p>
            )}
            {order.note && (
              <p className="mt-2 rounded-lg bg-stone-50 p-2 text-sm dark:bg-white/5">
                Note: {order.note}
              </p>
            )}
          </section>

          <section className="mt-4 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-2 font-medium">Items</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span>
                    {it.qty}× {it.product_name}
                    {it.options && it.options.length > 0 && (
                      <span className="text-black/50 dark:text-white/50">
                        {" "}({it.options.map((o) => o.value).join(", ")})
                      </span>
                    )}
                  </span>
                  <span>{formatCents(it.unit_price_cents * it.qty)}</span>
                </li>
              ))}
              <li className="mt-1 flex justify-between border-t border-black/10 pt-2 text-black/60 dark:border-white/10 dark:text-white/60">
                <span>Subtotal</span>
                <span>{formatCents(order.subtotal_cents)}</span>
              </li>
              {order.vat_cents > 0 && (
                <li className="flex justify-between text-black/60 dark:text-white/60">
                  <span>VAT (12%)</span>
                  <span>{formatCents(order.vat_cents)}</span>
                </li>
              )}
              <li className="flex justify-between text-black/60 dark:text-white/60">
                <span>Shipping{order.region ? ` · ${order.region}` : ""}</span>
                <span>{formatCents(order.shipping_cents)}</span>
              </li>
              <li className="flex justify-between border-t border-black/10 pt-2 font-semibold dark:border-white/10">
                <span>Total</span>
                <span>{formatCents(order.subtotal_cents + order.vat_cents + order.shipping_cents)}</span>
              </li>
            </ul>
          </section>

          <section className="mt-4 rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-3 font-medium">Update status</h2>
            <StatusControl orderNumber={order.order_number} current={order.status} />
          </section>
        </div>

        <div>
          <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <h2 className="mb-3 font-medium">Payment receipt</h2>
            {order.receipt_key ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/admin/orders/${order.order_number}/receipt`}
                alt="Payment receipt"
                className="w-full rounded-lg border border-black/10 dark:border-white/10"
              />
            ) : order.payment_method === "cod" ? (
              <p className="py-8 text-center text-sm text-black/50">
                Cash on Delivery — collect payment on delivery. No receipt.
              </p>
            ) : (
              <p className="py-8 text-center text-sm text-black/50">
                Customer hasn&apos;t uploaded a receipt yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
