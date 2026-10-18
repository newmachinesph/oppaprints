"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLOR_HEX } from "@/lib/config";
import type { OptionGroup, OptionValue } from "@/lib/types";

const isColorGroup = (name: string) => name.toLowerCase().includes("color");
const swatchOf = (v: { label: string; hex: string | null }) =>
  v.hex ?? COLOR_HEX[v.label] ?? "#cccccc";

export default function OptionGroupsManager({
  productId,
  groups,
}: {
  productId: number;
  groups: OptionGroup[];
}) {
  const router = useRouter();
  const [newGroup, setNewGroup] = useState("");
  const [busy, setBusy] = useState(false);

  const addGroup = async () => {
    if (!newGroup.trim()) return;
    setBusy(true);
    await fetch(`/api/admin/products/${productId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroup.trim() }),
    });
    setNewGroup("");
    setBusy(false);
    router.refresh();
  };

  const delGroup = async (groupId: number) => {
    if (!confirm("Delete this option and ALL variants of this product?")) return;
    await fetch(`/api/admin/products/${productId}/groups/${groupId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="border p-4" style={{ borderColor: "var(--line)" }}>
      {groups.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No options yet. Add groups like Size, Color, or Name — in the order buyers should pick them.
        </p>
      )}
      {groups.map((g) => (
        <div key={g.id} className="border-t py-3 first:border-t-0 first:pt-0" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              <span className="mr-2 font-mono text-xs text-[var(--muted)]">{g.position + 1}</span>
              {g.name}
            </span>
            <button onClick={() => delGroup(g.id)} className="text-xs text-rose-600 hover:underline">
              Delete option
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {g.values.map((v) => (
              <ValueChip key={v.id} productId={productId} groupId={g.id} value={v} isColor={isColorGroup(g.name)} />
            ))}
            <AddValue productId={productId} groupId={g.id} isColor={isColorGroup(g.name)} />
          </div>
        </div>
      ))}

      <div className="mt-4 flex gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <input
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          placeholder="New option name (e.g. Size)"
          className="flex-1 border bg-transparent px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--line)" }}
        />
        <button
          onClick={addGroup}
          disabled={busy}
          className="bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-[var(--background)] disabled:opacity-40"
        >
          Add option
        </button>
      </div>
    </div>
  );
}

function ValueChip({
  productId,
  groupId,
  value,
  isColor,
}: {
  productId: number;
  groupId: number;
  value: OptionValue;
  isColor: boolean;
}) {
  const router = useRouter();
  const remove = async () => {
    if (!confirm(`Delete "${value.label}" and any variant using it?`)) return;
    await fetch(`/api/admin/products/${productId}/groups/${groupId}/values/${value.id}`, {
      method: "DELETE",
    });
    router.refresh();
  };
  const setHex = async (hex: string) => {
    await fetch(`/api/admin/products/${productId}/groups/${groupId}/values/${value.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hex }),
    });
    router.refresh();
  };
  return (
    <span className="flex items-center gap-1 border px-2 py-1 text-sm" style={{ borderColor: "var(--line)" }}>
      {isColor && (
        <input
          type="color"
          value={swatchOf(value)}
          onChange={(e) => setHex(e.target.value)}
          title="Set swatch colour"
          className="h-5 w-5 shrink-0 cursor-pointer border-0 bg-transparent p-0"
        />
      )}
      {value.label}
      <button onClick={remove} aria-label="Delete value" className="text-[var(--muted)] hover:text-rose-600">
        ✕
      </button>
    </span>
  );
}

function AddValue({ productId, groupId, isColor }: { productId: number; groupId: number; isColor: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("#cccccc");
  const add = async () => {
    if (!label.trim()) return;
    await fetch(`/api/admin/products/${productId}/groups/${groupId}/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), ...(isColor ? { hex } : {}) }),
    });
    setLabel("");
    setHex("#cccccc");
    router.refresh();
  };
  return (
    <span className="flex items-center gap-1">
      {isColor && (
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          title="Swatch colour"
          className="h-5 w-5 shrink-0 cursor-pointer border-0 bg-transparent p-0"
        />
      )}
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder="+ value"
        className="w-24 border bg-transparent px-2 py-1 text-sm"
        style={{ borderColor: "var(--line)" }}
      />
    </span>
  );
}
