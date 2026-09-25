import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui";
import { formatStock } from "@/lib/format";
import type { ProductStock } from "@/lib/types";
import { useProducts } from "./api";
import { exactMatch, productLabel, searchProducts } from "./search";

/** Buscador para agregar productos a un documento: código, nombre, marca o medida. Enter agrega. */
export function ProductPicker({ onPick, placeholder = "Agregar producto: código, nombre, marca o medida" }: { onPick: (p: ProductStock) => void; placeholder?: string }) {
  const { data = [] } = useProducts();
  const active = useMemo(() => data.filter((p) => p.is_active), [data]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const results = useMemo(() => (q.trim() ? searchProducts(active, q).slice(0, 10) : []), [active, q]);
  const pick = (p: ProductStock) => { onPick(p); setQ(""); setIdx(0); };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-secondary" />
      <input
        value={q}
        autoFocus
        onChange={(e) => { setQ(e.target.value); setOpen(true); setIdx(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); const p = exactMatch(active, q) ?? results[idx]; if (p) pick(p); }
          if (e.key === "Escape") setQ("");
        }}
        placeholder={placeholder}
        aria-label="Buscar producto"
        className="h-11 w-full rounded-[12px] bg-white pr-3 pl-9 text-[14px] shadow-field outline-none focus:shadow-[0_0_0_2px_var(--color-brand)]"
      />
      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-[12px] bg-white p-1.5 shadow-popover">
          {results.map((p, i) => (
            <li key={p.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} onMouseEnter={() => setIdx(i)}
                className={cn("flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left", i === idx && "bg-surface-hover")}>
                <span className="w-20 shrink-0 font-mono text-[12px] text-ink-secondary">{p.code}</span>
                <span className="min-w-0 flex-1 truncate font-[550]">{productLabel(p)}</span>
                <span className={cn("shrink-0 text-[12px] tabular-nums", p.is_out ? "text-critical-strong" : p.is_low ? "text-warning" : "text-ink-secondary")}>
                  {formatStock(Number(p.stock), p.unit, p.pack_unit, Number(p.pack_size))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && q.trim() && results.length === 0 && (
        <p className="absolute inset-x-0 top-full z-20 mt-1 rounded-[12px] bg-white px-3 py-3 text-ink-secondary shadow-popover">Sin resultados para “{q}”.</p>
      )}
    </div>
  );
}
