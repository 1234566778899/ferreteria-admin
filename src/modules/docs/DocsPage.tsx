import { FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, cn, EmptyState, IndexTable, Page, Select, type Column } from "@/components/ui";
import { addDays, formatDateTime, formatMoney, kindLabels, reasonLabels, todayLima } from "@/lib/format";
import type { StockDoc } from "@/lib/types";
import { PAGE_SIZE, useDocs, type DocFilters } from "@/modules/products/api";
import { kindTone } from "./tones";

export function DocsPage() {
  const navigate = useNavigate();
  const today = todayLima();
  const [f, setF] = useState<DocFilters>({ kind: "", reason: "", search: "", from: addDays(today, -29), to: today, page: 1 });
  const set = (patch: Partial<DocFilters>) => setF({ ...f, page: 1, ...patch });
  const { data, isLoading } = useDocs(f);

  const columns: Column<StockDoc>[] = [
    { key: "n", header: "N.°", className: "whitespace-nowrap font-[650]", render: (d) => `#${d.number}` },
    { key: "d", header: "Fecha", className: "whitespace-nowrap", render: (d) => formatDateTime(d.created_at) },
    { key: "k", header: "Tipo", render: (d) => <Badge tone={kindTone[d.kind]}>{kindLabels[d.kind]}</Badge> },
    { key: "r", header: "Motivo", render: (d) => reasonLabels[d.reason] },
    { key: "p", header: "Proveedor / cliente", render: (d) => d.supplier_name ?? d.party ?? <span className="text-ink-tertiary">—</span> },
    { key: "ref", header: "Documento", render: (d) => d.reference ?? <span className="text-ink-tertiary">—</span> },
    { key: "u", header: "Registró", render: (d) => d.user_name ?? <span className="text-ink-tertiary">—</span> },
    { key: "l", header: "Líneas", align: "right", render: (d) => d.line_count },
    {
      key: "t", header: "Valor", align: "right", className: "whitespace-nowrap",
      render: (d) => d.voided_at ? <Badge tone="critical">Anulado</Badge>
        : <span className="tabular-nums">{formatMoney(d.reason === "venta" ? d.total_price : d.total_cost)}</span>,
    },
  ];

  return (
    <Page icon={FileText} title="Movimientos" width="full"
      actions={<><Button to="/entradas/nueva">Nueva entrada</Button><Button variant="primary" to="/salidas/nueva">Nueva salida</Button></>}>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="text-[12px] text-ink-secondary">Desde <input type="date" value={f.from} max={f.to} onChange={(e) => set({ from: e.target.value })} className="ml-1 h-7 rounded-[8px] px-2 shadow-field" /></label>
        <label className="text-[12px] text-ink-secondary">Hasta <input type="date" value={f.to} min={f.from} max={today} onChange={(e) => set({ to: e.target.value })} className="ml-1 h-7 rounded-[8px] px-2 shadow-field" /></label>
        <Select hideLabel label="Motivo" value={f.reason} onChange={(e) => set({ reason: e.target.value })} placeholder="Todos los motivos" className="w-52"
          options={Object.entries(reasonLabels).map(([value, label]) => ({ value, label }))} />
      </div>
      <IndexTable
        rows={data?.rows ?? []}
        columns={columns}
        getId={(d) => d.id}
        loading={isLoading}
        selectable={false}
        onRowClick={(d) => navigate(`/movimientos/${d.id}`)}
        resourceName={{ singular: "documento", plural: "documentos" }}
        pagination={{ page: f.page, pageSize: PAGE_SIZE, total: data?.count ?? 0, onChange: (page) => setF({ ...f, page }) }}
        toolbar={
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex gap-0.5">
              {[["", "Todos"], ["entrada", "Entradas"], ["salida", "Salidas"], ["ajuste", "Ajustes"]].map(([k, l]) => (
                <button key={k} type="button" onClick={() => set({ kind: k })} className={cn("h-7 rounded-[8px] px-2.5 text-[12px] font-[550]", f.kind === k ? "bg-surface-pressed" : "text-ink-secondary hover:bg-surface-hover")}>{l}</button>
              ))}
            </div>
            <input type="search" value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="N.°, documento, proveedor o cliente" aria-label="Buscar documentos"
              className="ml-auto h-7 w-full max-w-[260px] rounded-[8px] bg-white px-2.5 text-[12px] shadow-field outline-none focus:shadow-[0_0_0_2px_var(--color-brand)]" />
          </div>
        }
        empty={<EmptyState icon={FileText} title="No hay movimientos en este periodo" description="Cambia las fechas o los filtros." />}
      />
    </Page>
  );
}
