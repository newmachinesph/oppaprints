import { notFound } from "next/navigation";
import { productBySlug } from "@/lib/queries";
import ProductDetail from "@/components/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await productBySlug(slug);
  if (!product || !product.active) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <ProductDetail product={product} />
    </div>
  );
}
