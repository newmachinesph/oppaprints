import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="max-w-xl">
      <Link href="/admin/products" className="text-sm text-black/55 hover:underline dark:text-white/55">
        ← All products
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold tracking-tight">New product</h1>
      <p className="mb-5 text-sm text-black/55 dark:text-white/55">
        Create the product, then add its color/size combinations and images on the next screen.
      </p>
      <ProductForm mode="create" />
    </div>
  );
}
