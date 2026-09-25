import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Home, PackageX, Snail, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Button, Card, CardHeader, cn, Page, Skeleton } from "@/components/ui";
import { formatDateTime, formatMoney, formatQty, formatShortDate, fullName, kindLabels, reasonLabels } from "@/lib/format";
import { supabase, unwrap } from "@/lib/supabase";
import { useStaff } from "@/modules/auth/AuthProvider";
import { kindTone } from "@/modules/docs/tones";
import { productLabel } from "@/modules/products/search";

type Dashboard = {
  days: number; dead_days: number;
  totals: { products: number; value_cost: number; value_price: number; out: number; low: number; dead: number; dead_value: number };
  series: { date: string; entradas: number; salidas: number }[];
  period: { entries_cost: number; exits_cost: number; sales: number; sales_cost: number; losses: number; docs: number };
  top_exits: { id: string; code: string; name: string; brand: string | null; model: string | null; unit: string; quantity: number; value: number }[];
  low: { id: string; code: string; name: string; brand: string | null; model: string | null; unit: string; stock: number; min_stock: number; supplier_name: string | null }[];
  dead: { id: string; code: string; name: string; brand: string | null; model: string | null; unit: string; stock: number; value_cost: number; last_exit_at: string | null }[];
  by_category: { name: string; color: string; value: number; products: number }[];
  recent: { id: string; number: number; kind: string; reason: string; reference: string | null; party: string | null; supplier_name: string | null; total_cost: number; total_price: number; line_count: number; created_at: string; user_name: string | null; voided_at: string | null }[];
};

// Validado con dataviz/validate_palette.js (light): ALL PASS, CVD ΔE 31.
const IN = "#2563eb";
const OUT = "#e8590c";
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" });

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Dashboard["series"][number] }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-[10px] bg-white px-3 py-2 text-[12px] shadow-popover">
      <p className="text-ink-secondary">{dayLabel(p.date)}</p>
      <p className="mt-0.5 flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: IN }} />Entradas <strong className="ml-auto pl-3">{formatMoney(p.entradas)}</strong></p>
      <p className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: OUT }} />Salidas <strong className="ml-auto pl-3">{formatMoney(p.salidas)}</strong></p>
    </div>
  );
}

function Alert({ to, icon: Icon, tone, title, value, detail }: { to: string; icon: typeof AlertTriangle; tone: "critical" | "warning" | "info" | "neutral"; title: string; value: string; detail: string }) {
  const tones = { critical: "bg-critical-soft text-critical", warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info", neutral: "bg-surface-pressed text-ink-secondary" };
  return (
    <Link to={to} className="flex items-center gap-3 rounded-[16px] bg-white p-4 shadow-card transition-shadow hover:shadow-popover">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-[12px]", tones[tone])}><Icon className="size-5" strokeWidth={1.8} /></span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-ink-secondary">{title}</span>
        <span className="block text-[18px] font-[650] tabular-nums">{value}</span>
        <span className="block truncate text-[12px] text-ink-secondary">{detail}</span>
      </span>
    </Link>
  );
}

export function DashboardPage() {
  const staff = useStaff();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", days],
    queryFn: async () => unwrap(await supabase.rpc("inv_dashboard", { p_days: days })) as Dashboard,
  });
  const catMax = Math.max(1, ...(data?.by_category.map((c) => Number(c.value)) ?? [1]));
  const potential = data ? Number(data.totals.value_price) - Number(data.totals.value_cost) : 0;

  return (
    <Page icon={Home} title="Inicio" width="full"
      actions={
        <>
          <div className="flex rounded-[10px] bg-surface-pressed/70 p-0.5">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)} className={cn("h-7 rounded-[8px] px-2.5 text-[12px] font-[550]", days === d ? "bg-white shadow-button" : "text-ink-secondary")}>{d} días</button>
            ))}
          </div>
          <Button icon={ArrowDownToLine} to="/entradas/nueva">Entrada</Button>
          <Button variant="brand" icon={ArrowUpFromLine} to="/salidas/nueva">Salida</Button>
        </>
      }>
      <h1 className="mb-4 px-1 text-[20px] font-[650]">Hola, {fullName(staff.first_name) || "equipo"} 👋</h1>

      <Card padded={false} className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4 [&>*]:bg-white">
        {isLoading || !data ? Array.from({ length: 4 }, (_, i) => <div key={i} className="px-4 py-3"><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-6 w-28" /></div>) : (
          <>
            <div className="px-4 py-3"><p className="text-[12px] text-ink-secondary">Valor del inventario (costo)</p><p className="mt-1 text-[22px] font-[650] tabular-nums">{formatMoney(data.totals.value_cost)}</p><p className="text-[11px] text-ink-tertiary">{data.totals.products} productos activos</p></div>
            <div className="px-4 py-3"><p className="text-[12px] text-ink-secondary">Valor a precio de venta</p><p className="mt-1 text-[22px] font-[650] tabular-nums">{formatMoney(data.totals.value_price)}</p><p className="text-[11px] text-ink-tertiary">Margen potencial {formatMoney(potential)}</p></div>
            <div className="px-4 py-3"><p className="text-[12px] text-ink-secondary">Ventas ({days} días)</p><p className="mt-1 text-[22px] font-[650] tabular-nums">{formatMoney(data.period.sales)}</p><p className="text-[11px] text-ink-tertiary">Utilidad bruta {formatMoney(Number(data.period.sales) - Number(data.period.sales_cost))}</p></div>
            <div className="px-4 py-3"><p className="text-[12px] text-ink-secondary">Compras ({days} días)</p><p className="mt-1 text-[22px] font-[650] tabular-nums">{formatMoney(data.period.entries_cost)}</p><p className="text-[11px] text-ink-tertiary">Mermas {formatMoney(data.period.losses)}</p></div>
          </>
        )}
      </Card>

      {data && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Alert to="/productos?vista=agotados" icon={PackageX} tone="critical" title="Agotados" value={`${data.totals.out} productos`} detail={data.totals.out ? "Sin stock para vender" : "Ninguno agotado"} />
          <Alert to="/productos?vista=bajo" icon={AlertTriangle} tone="warning" title="Stock bajo" value={`${data.totals.low} productos`} detail="Por debajo del mínimo: reponer" />
          <Alert to="/productos?vista=sin-movimiento" icon={Snail} tone="neutral" title={`Sin movimiento (${data.dead_days} días)`} value={`${data.totals.dead} productos`} detail={`${formatMoney(data.totals.dead_value)} inmovilizados`} />
          <Alert to="/movimientos" icon={Wallet} tone="info" title={`Documentos (${days} días)`} value={String(data.period.docs)} detail={`Salidas a costo ${formatMoney(data.period.exits_cost)}`} />
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Entradas y salidas por día" description="Valorizadas a costo" />
          <div className="h-[380px]" role="img" aria-label="Gráfico de entradas y salidas por día">
            {data && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
                  <CartesianGrid vertical={false} stroke="#ebebeb" />
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 11, fill: "#616161" }} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis tickFormatter={(v) => `S/ ${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`} tick={{ fontSize: 11, fill: "#616161" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,.04)" }} />
                  <Legend verticalAlign="top" align="right" height={28} iconType="circle" iconSize={8} formatter={(v) => <span className="text-[12px] text-ink-secondary">{v === "entradas" ? "Entradas" : "Salidas"}</span>} />
                  <Bar dataKey="entradas" fill={IN} radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="salidas" fill={OUT} radius={[4, 4, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Valor por categoría" description="Inventario a costo" />
          <ul className="space-y-2.5">
            {data?.by_category.map((c) => (
              <li key={c.name}>
                <div className="flex justify-between text-[13px]"><span className="font-[550]">{c.name}</span><span className="tabular-nums">{formatMoney(c.value)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-surface-pressed"><div className="h-2 rounded-full" style={{ width: `${(Number(c.value) / catMax) * 100}%`, background: c.color }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Card>
          <CardHeader title="Por reponer" actions={<Button variant="plain" to="/productos?vista=bajo">Ver todos</Button>} />
          {data?.low.length === 0 && <p className="text-ink-secondary">Todo está sobre el mínimo.</p>}
          <ul className="divide-y divide-border">
            {data?.low.map((p) => (
              <li key={p.id}>
                <Link to={`/productos/${p.id}`} className="flex items-center gap-3 py-2 hover:text-brand">
                  <span className="min-w-0 flex-1"><span className="block truncate font-[550]">{productLabel(p)}</span><span className="text-[12px] text-ink-secondary">{p.supplier_name ?? p.code}</span></span>
                  <span className={cn("text-[12px] tabular-nums whitespace-nowrap", Number(p.stock) <= 0 ? "font-[650] text-critical-strong" : "text-warning")}>{Number(p.stock) <= 0 ? "Agotado" : formatQty(p.stock, p.unit)}</span>
                  <span className="w-20 text-right text-[12px] whitespace-nowrap text-ink-tertiary">mín. {formatQty(p.min_stock)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={`Más salidas (${days} días)`} />
          {data?.top_exits.length === 0 && <p className="text-ink-secondary">Sin salidas en este periodo.</p>}
          <ol className="divide-y divide-border">
            {data?.top_exits.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="w-5 text-center text-[12px] font-[650] text-ink-tertiary">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-[550]">{productLabel(p)}</span>
                <span className="text-[12px] whitespace-nowrap text-ink-secondary tabular-nums">{formatQty(p.quantity, p.unit)}</span>
                <span className="w-24 text-right tabular-nums">{formatMoney(p.value)}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardHeader title="Sin movimiento" description={`Con stock y sin salidas en ${data?.dead_days ?? 90} días`} actions={<Button variant="plain" to="/productos?vista=sin-movimiento">Ver todos</Button>} />
          {data?.dead.length === 0 && <p className="text-ink-secondary">Todo el stock está rotando.</p>}
          <ul className="divide-y divide-border">
            {data?.dead.map((p) => (
              <li key={p.id}>
                <Link to={`/productos/${p.id}`} className="flex items-center gap-3 py-2 hover:text-brand">
                  <span className="min-w-0 flex-1"><span className="block truncate font-[550]">{productLabel(p)}</span>
                    <span className="text-[12px] text-ink-secondary">{p.last_exit_at ? `Última salida ${formatShortDate(p.last_exit_at)}` : "Nunca ha salido"}</span></span>
                  <span className="text-[12px] whitespace-nowrap text-ink-secondary tabular-nums">{formatQty(p.stock, p.unit)}</span>
                  <span className="w-24 text-right tabular-nums">{formatMoney(p.value_cost)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-2 2xl:col-span-3">
          <CardHeader title="Últimos movimientos" actions={<Button variant="plain" to="/movimientos">Ver todos</Button>} />
          <ul className="divide-y divide-border">
            {data?.recent.map((d) => (
              <li key={d.id}>
                <Link to={`/movimientos/${d.id}`} className="flex flex-wrap items-center gap-3 py-2 hover:text-brand">
                  <span className="w-14 font-[650]">#{d.number}</span>
                  <Badge tone={kindTone[d.kind]}>{kindLabels[d.kind]}</Badge>
                  <span className="w-40 text-ink-secondary">{reasonLabels[d.reason]}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink-secondary">{[d.supplier_name, d.party, d.reference, d.user_name].filter(Boolean).join(" · ")}</span>
                  <span className="text-[12px] text-ink-secondary">{formatDateTime(d.created_at)}</span>
                  {d.voided_at ? <Badge tone="critical">Anulado</Badge> : <span className="w-24 text-right tabular-nums">{formatMoney(d.reason === "venta" ? d.total_price : d.total_cost)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
