import { normalize } from "@/lib/format";
import type { ProductStock } from "@/lib/types";

const haystack = (p: ProductStock) => normalize([p.code, p.barcode, p.name, p.brand, p.model, p.category_name, p.location].filter(Boolean).join(" "));

/** Cada palabra debe aparecer (código, nombre, marca, medida…). Código exacto primero. */
export function searchProducts(products: ProductStock[], query: string) {
  const q = normalize(query.trim());
  if (!q) return products;
  const terms = q.split(/\s+/);
  return products
    .filter((p) => q === normalize(p.code) || p.barcode === query.trim() || terms.every((t) => haystack(p).includes(t)))
    .sort((a, b) => {
      const score = (p: ProductStock) => (normalize(p.code) === q || p.barcode === query.trim() ? 100 : 0) + (normalize(p.name).startsWith(q) ? 10 : 0);
      return score(b) - score(a) || a.name.localeCompare(b.name, "es");
    });
}

export const exactMatch = (products: ProductStock[], query: string) => {
  const q = query.trim().toLowerCase();
  return q ? products.find((p) => p.code.toLowerCase() === q || p.barcode === query.trim()) : undefined;
};

/** "Cemento Portland Tipo I · Sol · Bolsa 42.5 kg" */
export const productLabel = (p: { name: string; brand?: string | null; model?: string | null }) => [p.name, p.brand, p.model].filter(Boolean).join(" · ");
