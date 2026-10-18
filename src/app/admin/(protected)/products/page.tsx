import Link from "next/link";
import { adminProducts } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";

export default async function AdminProductsPage() {
  const products = await adminProducts();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products & stock</h1>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            Edit stock and manage images per product.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="shrink-0 bg-black px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + Add product
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left dark:bg-white/5">
            <tr>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="px-4 py-2.5 font-medium">Options</th>
              <th className="px-4 py-2.5 font-medium">Images</th>
              <th className="px-4 py-2.5 font-medium">Stock</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              return (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{p.name}</span>
                    {!p.active && <span className="ml-2 text-xs text-rose-600">hidden</span>}
                  </td>
                  <td className="px-4 py-2.5">{formatCents(p.price_cents)}</td>
                  <td className="px-4 py-2.5 text-black/60 dark:text-white/60">{p.variant_count} variants</td>
                  <td className="px-4 py-2.5">{p.image_count}</td>
                  <td className="px-4 py-2.5">
                    <span className={p.total_stock <= LOW_STOCK_THRESHOLD ? "font-medium text-amber-600" : ""}>
                      {p.total_stock}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
