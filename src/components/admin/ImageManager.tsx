"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { imageUrl } from "@/lib/config";
import type { ProductImage } from "@/lib/types";

export default function ImageManager({
  productId,
  images,
}: {
  productId: number;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Upload failed");
      return;
    }
    router.refresh();
  };

  const setPrimary = async (imageId: number) => {
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: "PATCH" });
    router.refresh();
  };

  const remove = async (imageId: number) => {
    if (!confirm("Delete this image?")) return;
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <div className="grid grid-cols-3 gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(img.key)} alt="" className="aspect-square w-full object-cover" />
            {img.is_primary && (
              <span className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Primary
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
              {!img.is_primary && (
                <button onClick={() => setPrimary(img.id)} className="text-[11px] text-white hover:underline">
                  Set primary
                </button>
              )}
              <button onClick={() => remove(img.id)} className="ml-auto text-[11px] text-rose-300 hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-3 py-4 text-center text-sm text-black/50">No images yet</p>
        )}
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Add image (JPG, PNG, HEIC)</span>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
          className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-white disabled:opacity-50 dark:file:bg-white dark:file:text-black"
        />
      </label>
      {busy && <p className="mt-2 text-sm text-black/50">Uploading & converting…</p>}
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
