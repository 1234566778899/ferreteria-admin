import { ClipboardList } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge, IndexTable, Page, Select, type Column } from "@/components/ui";
import { formatDateTime, formatMoney, formatQty, kindLabels, reasonLabels } from "@/lib/format";
import type { MovementRow } from "@/lib/types";
import { useIsAdmin } from "@/modules/auth/AuthProvider";
import { useMovements, useProducts } from "@/modules/products/api";
import { productLabel } from "@/modules/products/search";
import { kindTone } from "./tones";

export function KardexPage() {
  const [params, setParams] = useSearchParams();
  const productId = params.get("producto") ?? "";
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const isAdmin = useIsAdmin();
  const { data: products = [] } = useProducts();
  const { data, isLoading } = useMovements({ productId: productId || undefined, kind: kind || undefined, page });

  const columns: Column<MovementRow>[] = [
    { key: "d", header: "Fecha", className: "whitespace-nowrap max-sm:text-[12px]", render: (m) => formatDateTime(m.created_at) },
    ...(!productId ? [{ key: "p", header: "Producto", render: (m: MovementRow) => <span className="font-[550]">{productLabel({ name: m.product_name, brand: m.brand, model: m.model })}</span> }] : []),
    { key: "doc", header: "Documento", hideBelow: "md", className: "whitespace-nowrap", render: (m) => <Link to={`/movimientos/${m.doc_id}`} onClick={(e) => e.stopPropagation()} className="text-brand hover:underline">{kindLabels[m.kind]} #{m.doc_number}</Link> },
    { key: "r", header: "Motivo", hideBelow: "sm", render: (m) => <span className="inline-flex items-center gap-1.5"><Badge tone={kindTone[m.kind]}>{reasonLabels[m.reason]}</Badge>{m.voided_at && <Badge tone="critical">Anulado</Badge>}</span> },
    { key: "x", header: "Detalle", hideBelow: "xl", render: (m) => <span className="text-ink-secondary">{[m.reference, m.party, m.user_name].filter(Boolean).join(" · ") || "—"}</span> },
    { key: "in", header: "Entrada", align: "right", className: "whitespace-nowrap tabular-nums text-success", render: (m) => (Number(m.quantity) > 0 ? formatQty(m.quantity) : "") },
    { key: "out", header: "Salida", align: "right", className: "whitespace-nowrap tabular-nums text-critical-strong", render: (m) => (Number(m.quantity) < 0 ? formatQty(-Number(m.quantity)) : "") },
    ...(isAdmin ? [{ key: "c", header: "Costo u.", align: "right" as const, hideBelow: "lg" as const, className: "whitespace-nowrap tabular-nums text-ink-secondary", render: (m: MovementRow) => formatMoney(m.unit_cost) }] : []),
    { key: "b", header: "Saldo", align: "right", className: "whitespace-nowrap font-[550] tabular-nums", render: (m) => formatQty(m.balance, m.unit) },
  ];

  return (
    <Page icon={ClipboardList} title="Kardex" width="full" subtitle="Movimientos de stock en unidad base, del más reciente al más antiguo.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Select hideLabel label="Producto" value={productId} onChange={(e) => { setParams(e.target.value ? { producto: e.target.value } : {}); setPage(1); }} placeholder="Todos los productos"
          options={products.map((p) => ({ value: p.id, label: `${p.code} · ${productLabel(p)}` }))} className="w-full sm:w-96" />
        <Select hideLabel label="Tipo" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }} placeholder="Entradas, salidas y ajustes"
          options={Object.entries(kindLabels).map(([value, label]) => ({ value, label: `${label}s` }))} className="w-full sm:w-56" />
      </div>
      <IndexTable rows={data?.rows ?? []} columns={columns} getId={(m) => m.id} loading={isLoading} selectable={false}
        resourceName={{ singular: "movimiento", plural: "movimientos" }}
        pagination={{ page, pageSize: 50, total: data?.count ?? 0, onChange: setPage }}
        empty={<p className="px-4 py-8 text-center text-ink-secondary">Sin movimientos.</p>} />
    </Page>
  );
}
