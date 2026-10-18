import { REGIONS, SHIPPING_ROWS } from "@/lib/shipping";
import { formatCents } from "@/lib/money";

// Region × weight-tier courier rate card. Pure — safe in server or client trees.
export default function ShippingRatesTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--accent)] text-[var(--on-accent)]">
            <Th>Weight</Th>
            {REGIONS.map((r) => (
              <Th key={r}>{r}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHIPPING_ROWS.map((row) => (
            <tr key={row.label} className="border-t" style={{ borderColor: "var(--line)" }}>
              <td className="px-3 py-2 font-medium whitespace-nowrap">{row.label}</td>
              {row.cents.map((c, i) => (
                <td key={i} className="px-3 py-2 text-center tabular-nums">
                  {formatCents(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Shipping is auto-computed at checkout from your region and total order weight.
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">{children}</th>;
}
