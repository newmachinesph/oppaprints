import Link from "next/link";
import { notFound } from "next/navigation";
import { productById } from "@/lib/queries";
import { formatCents } from "@/lib/money";
import ProductForm from "@/components/admin/ProductForm";
import ImageManager from "@/components/admin/ImageManager";
import OptionGroupsManager from "@/components/admin/OptionGroupsManager";
import VariantManager from "@/components/admin/VariantManager";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const product = await productById(Number((await params).id));
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-[var(--muted)] hover:underline">
        ← All products
      </Link>
      <h1 className="font-display mt-2 text-2xl">{product.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Base price {formatCents(product.price_cents)}</p>

      <section className="mt-8 max-w-xl">
        <h2 className="mb-3 text-lg font-medium">Product settings</h2>
        <ProductForm mode="edit" product={product} />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium">Product images</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">Shown in the catalog and gallery.</p>
          <ImageManager productId={product.id} images={product.images} />
        </section>
        <section>
          <h2 className="mb-1 text-lg font-medium">Options (taxonomy)</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Ordered groups buyers pick in sequence — e.g. Size → Color → Name.
          </p>
          <OptionGroupsManager productId={product.id} groups={product.groups} />
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-medium">Variants (combinations)</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Each combination has its own stock, optional price override, and optional image.
        </p>
        <VariantManager
          productId={product.id}
          basePriceCents={product.price_cents}
          groups={product.groups}
          variants={product.variants}
        />
      </section>
    </div>
  );
}
