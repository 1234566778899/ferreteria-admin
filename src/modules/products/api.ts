import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, unwrap } from "@/lib/supabase";
import type { Category, DocDetail, MovementRow, Product, ProductStock, StockDoc, Supplier } from "@/lib/types";

/** Todo lo que depende del stock. */
export function useInvalidateStock() {
  const qc = useQueryClient();
  return () => ["products", "docs", "movements", "dashboard"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useProducts() {
  return useQuery({
    queryKey: ["products", "list"],
    queryFn: async () => unwrap(await supabase.from("product_stock").select("*").order("name").order("model").limit(10000)) as ProductStock[],
    staleTime: 30_000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => unwrap(await supabase.from("product_stock").select("*").eq("id", id!).single()) as ProductStock,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: async () => unwrap(await supabase.from("category").select("*").order("rank").order("name")) as Category[], staleTime: 5 * 60_000 });
}

export function useSuppliers() {
  return useQuery({ queryKey: ["suppliers"], queryFn: async () => unwrap(await supabase.from("supplier").select("*").order("name")) as Supplier[], staleTime: 5 * 60_000 });
}

export type ProductDraft = Omit<Product, "id" | "created_at" | "stock"> & { id?: string };

export function useSaveProduct() {
  const invalidate = useInvalidateStock();
  return useMutation({
    mutationFn: async (p: ProductDraft) => {
      const { id, ...row } = p;
      const clean = {
        ...row, code: row.code.trim().toUpperCase(), barcode: row.barcode?.trim() || null, brand: row.brand?.trim() || null, model: row.model?.trim() || null,
        pack_unit: row.pack_unit?.trim() || null, pack_size: row.pack_unit?.trim() ? row.pack_size : 1, price_pack: row.pack_unit?.trim() ? row.price_pack || null : null,
        location: row.location?.trim() || null, notes: row.notes?.trim() || null,
      };
      const res = id ? await supabase.from("product").update(clean).eq("id", id).select("id").single() : await supabase.from("product").insert(clean).select("id").single();
      return unwrap(res).id as string;
    },
    onSuccess: invalidate,
  });
}

export type LineInput = { product_id: string; quantity: number; unit: "base" | "pack"; unit_cost?: number | null; unit_price?: number | null };

export function useRegisterDoc(kind: "entrada" | "salida") {
  const invalidate = useInvalidateStock();
  return useMutation({
    mutationFn: async (p: { reason: string; supplier_id?: string | null; party?: string; reference?: string; note?: string; items: LineInput[] }) =>
      unwrap(await supabase.rpc(kind === "entrada" ? "inv_entry" : "inv_exit", { p })) as StockDoc,
    onSuccess: invalidate,
  });
}

export function useRegisterCount() {
  const invalidate = useInvalidateStock();
  return useMutation({
    mutationFn: async (p: { note?: string; items: { product_id: string; counted: number }[] }) => unwrap(await supabase.rpc("inv_count", { p })) as StockDoc | null,
    onSuccess: invalidate,
  });
}

export function useVoidDoc() {
  const invalidate = useInvalidateStock();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => unwrap(await supabase.rpc("inv_void_doc", { p_doc: id, p_reason: reason })) as StockDoc,
    onSuccess: invalidate,
  });
}

export function useDoc(id: string | undefined) {
  return useQuery({ queryKey: ["docs", "detail", id], enabled: Boolean(id), queryFn: async () => unwrap(await supabase.rpc("inv_doc", { p_doc: id })) as DocDetail });
}

export type DocFilters = { kind: string; reason: string; search: string; from: string; to: string; page: number };
export const PAGE_SIZE = 50;
const limaStart = (d: string) => `${d}T00:00:00-05:00`;
const limaEnd = (d: string) => `${d}T23:59:59.999-05:00`;

export function useDocs(f: DocFilters) {
  return useQuery({
    queryKey: ["docs", "list", f],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("doc_list").select("*", { count: "exact" }).order("created_at", { ascending: false })
        .gte("created_at", limaStart(f.from)).lte("created_at", limaEnd(f.to)).range((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE - 1);
      if (f.kind) q = q.eq("kind", f.kind);
      if (f.reason) q = q.eq("reason", f.reason);
      const term = f.search.replace(/[,()*%]/g, " ").trim();
      if (term) q = /^\d+$/.test(term) ? q.or(`number.eq.${term},reference.ilike.%${term}%`) : q.or(`reference.ilike.%${term}%,party.ilike.%${term}%,supplier_name.ilike.%${term}%`);
      const res = await q;
      if (res.error) throw new Error(res.error.message);
      return { rows: res.data as StockDoc[], count: res.count ?? 0 };
    },
  });
}

export function useMovements(f: { productId?: string; kind?: string; page: number; pageSize?: number }) {
  const size = f.pageSize ?? 50;
  return useQuery({
    queryKey: ["movements", f],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("movement_list").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((f.page - 1) * size, f.page * size - 1);
      if (f.productId) q = q.eq("product_id", f.productId);
      if (f.kind) q = q.eq("kind", f.kind);
      const res = await q;
      if (res.error) throw new Error(res.error.message);
      return { rows: res.data as MovementRow[], count: res.count ?? 0 };
    },
  });
}
