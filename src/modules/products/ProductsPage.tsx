import { Download, Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useBusiness } from "@/components/layout/AppFrame";
import { Badge, Button, EmptyState, IndexTable, IndexToolbar, Page, Select, type Column } from "@/components/ui";
import { formatMoney, formatQty, formatShortDate, formatStock } from "@/lib/format";
import type { ProductStock } from "@/lib/types";
import { useIsAdmin } from "@/modules/auth/AuthProvider";
import { useCategories, useProducts } from "./api";
import { searchProducts } from "./search";

type View = "todos" | "bajo" | "agotados" | "sin-movimiento" | "inactivos";
const views: { value: View; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "bajo", label: "Stock bajo" },
  { value: "agotados", label: "Agotados" },
  { value: "sin-movimiento", label: "Sin movimiento" },
  { value: "inactivos", label: "Inactivos" },
];
const PAGE = 50;

/** Descarga la lista filtrada como CSV (se abre en Excel). */
function exportCsv(rows: ProductStock[], showCost: boolean) {
  const head = ["Código", "Producto", "Marca", "Medida/Modelo", "Categoría", "Unidad", "Stock", "Stock mínimo", "Ubicación", ...(showCost ? ["Costo", "Valor a costo"] : []), "Precio", "Proveedor"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((p) => [p.code, p.name, p.brand, p.model, p.category_name, p.unit, p.stock, p.min_stock, p.location, ...(showCost ? [p.cost, p.value_cost] : []), p.price, p.supplier_name].map(esc).join(";"));
  const blob = new Blob(["﻿" + [head.map(esc).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function ProductsPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: business } = useBusiness();
  const deadDays = business?.dead_stock_days ?? 90;
  const [params, setParams] = useSearchParams();
  const view = (params.get("vista") as View) || "todos";
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const rows = useMemo(() => {
    const cutoff = Date.now() - deadDays * 86400000;
    const filtered = data.filter((p) => {
      if (view === "inactivos" ? p.is_active : !p.is_active) return false;
      if (view === "bajo" && !(p.is_low || p.is_out)) return false;
      if (view === "agotados" && !p.is_out) return false;
      if (view === "sin-movimiento" && !(Number(p.stock) > 0 && (!p.last_exit_at || new Date(p.last_exit_at).getTime() < cutoff))) return false;
      return !category || p.category_id === category;
    });
    return searchProducts(filtered, search);
  }, [data, view, category, search, deadDays]);

  const totals = useMemo(() => ({ cost: rows.reduce((n, p) => n + Number(p.value_cost), 0), price: rows.reduce((n, p) => n + Number(p.value_price), 0) }), [rows]);

  const columns: Column<ProductStock>[] = [
    { key: "code", header: "Código", hideBelow: "md", className: "whitespace-nowrap font-mono text-[12px] text-ink-secondary", render: (p) => p.code },
    {
      key: "name", header: "Producto",
      render: (p) => (
        <div className="min-w-0">
          <p className="font-[550]">{p.name}</p>
          <p className="text-[12px] text-ink-secondary">
            <span className="mr-1.5 font-mono md:hidden">{p.code}</span>
            {[p.brand, p.model, p.location && `Ubic. ${p.location}`].filter(Boolean).join(" · ")}
          </p>
        </div>
      ),
    },
    { key: "cat", header: "Categoría", hideBelow: "lg", className: "whitespace-nowrap", render: (p) => p.category_name ? <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: p.category_color ?? "#ccc" }} />{p.category_name}</span> : "—" },
    {
      key: "stock", header: "Stock", align: "right", className: "whitespace-nowrap",
      render: (p) => p.is_out ? <Badge tone="critical">Agotado</Badge>
        : <span className={p.is_low ? "font-[550] text-warning" : "tabular-nums"}>{formatStock(Number(p.stock), p.unit, p.pack_unit, Number(p.pack_size))}</span>,
    },
    { key: "min", header: "Mínimo", align: "right", hideBelow: "md", className: "whitespace-nowrap text-ink-secondary", render: (p) => formatQty(p.min_stock) },
    ...(isAdmin ? [{ key: "cost", header: "Costo", align: "right" as const, hideBelow: "lg" as const, className: "whitespace-nowrap tabular-nums", render: (p: ProductStock) => formatMoney(p.cost) }] : []),
    { key: "price", header: "Precio", align: "right", hideBelow: "sm", className: "whitespace-nowrap tabular-nums", render: (p) => <>{formatMoney(p.price)}<span className="text-[11px] text-ink-tertiary"> /{p.unit}</span></> },
    ...(isAdmin ? [{ key: "value", header: "Valor (costo)", align: "right" as const, hideBelow: "xl" as const, className: "whitespace-nowrap tabular-nums", render: (p: ProductStock) => formatMoney(p.value_cost) }] : []),
    { key: "last", header: "Última salida", hideBelow: "xl", className: "whitespace-nowrap text-ink-secondary", render: (p) => (p.last_exit_at ? formatShortDate(p.last_exit_at) : "—") },
  ];

  return (
    <Page icon={Package} title="Productos" width="full"
      actions={
        <>
          <Button icon={Download} onClick={() => exportCsv(rows, isAdmin)}>Exportar</Button>
          {isAdmin && <Button variant="primary" icon={Plus} to="/productos/nuevo">Nuevo producto</Button>}
        </>
      }>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-ink-secondary">
        <span><strong className="text-ink">{rows.length}</strong> productos</span>
        {isAdmin && <span>Valor a costo <strong className="text-ink tabular-nums">{formatMoney(totals.cost)}</strong></span>}
        <span>Valor a precio de venta <strong className="text-ink tabular-nums">{formatMoney(totals.price)}</strong></span>
        <Select hideLabel label="Categoría" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} placeholder="Todas las categorías"
          options={categories.map((c) => ({ value: c.id, label: c.name }))} className="w-full sm:ml-auto sm:w-56" />
      </div>
      <IndexTable
        rows={rows.slice((page - 1) * PAGE, page * PAGE)}
        columns={columns}
        getId={(p) => p.id}
        loading={isLoading}
        selectable={false}
        onRowClick={(p) => navigate(`/productos/${p.id}`)}
        resourceName={{ singular: "producto", plural: "productos" }}
        pagination={{ page, pageSize: PAGE, total: rows.length, onChange: setPage }}
        toolbar={
          <IndexToolbar views={views.map((v) => (v.value === "sin-movimiento" ? { ...v, label: `Sin movimiento (${deadDays} d)` } : v))} view={view}
            onViewChange={(v) => { setParams(v === "todos" ? {} : { vista: v }); setPage(1); }}
            search={search} onSearchChange={(s) => { setSearch(s); setPage(1); }} placeholder="Código, nombre, marca o medida" />
        }
        empty={<EmptyState icon={Package} title="No hay productos aquí" description={view === "bajo" ? "Todo está sobre el stock mínimo." : "Prueba con otra búsqueda o vista."} />}
      />
    </Page>
  );
}
