import { ArrowDownToLine, ArrowUpFromLine, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useBusiness } from "@/components/layout/AppFrame";
import { Banner, Button, Card, CardHeader, cn, Layout, Page, Select, TextArea, TextField, useToast } from "@/components/ui";
import { formatMoney, formatQty, reasonLabels } from "@/lib/format";
import type { ProductStock } from "@/lib/types";
import { useProducts, useRegisterDoc, useSuppliers } from "@/modules/products/api";
import { ProductPicker } from "@/modules/products/ProductPicker";
import { productLabel } from "@/modules/products/search";

type Kind = "entrada" | "salida";
type Row = { key: number; product: ProductStock; qty: string; unit: "base" | "pack"; amount: string };

const reasons: Record<Kind, string[]> = {
  entrada: ["compra", "inventario_inicial", "devolucion_cliente", "otro"],
  salida: ["venta", "consumo_interno", "merma", "devolucion_proveedor", "otro"],
};

const factor = (r: Row) => (r.unit === "pack" ? Number(r.product.pack_size) : 1);
const baseQty = (r: Row) => (Number(r.qty) || 0) * factor(r);
/** Costo o precio sugerido para la unidad elegida. */
function defaultAmount(p: ProductStock, unit: "base" | "pack", kind: Kind) {
  const f = unit === "pack" ? Number(p.pack_size) : 1;
  if (kind === "entrada") return (Number(p.cost) * f).toFixed(2);
  return (unit === "pack" && p.price_pack != null ? Number(p.price_pack) : Number(p.price) * f).toFixed(2);
}

let nextKey = 1;

export function DocFormPage({ kind }: { kind: Kind }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: business } = useBusiness();
  const register = useRegisterDoc(kind);
  const [reason, setReason] = useState(reasons[kind][0]);
  const [supplier, setSupplier] = useState("");
  const [party, setParty] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const preloaded = useRef(false);

  const priced = kind === "entrada" ? reason !== "devolucion_cliente" : reason === "venta";
  const amountLabel = kind === "entrada" ? "Costo" : "Precio";

  const add = (p: ProductStock) => {
    const existing = rows.find((r) => r.product.id === p.id);
    if (existing) return setRows(rows.map((r) => (r.key === existing.key ? { ...r, qty: String((Number(r.qty) || 0) + 1) } : r)));
    const unit: Row["unit"] = kind === "entrada" && p.pack_unit ? "pack" : "base";
    setRows([...rows, { key: nextKey++, product: p, qty: "1", unit, amount: defaultAmount(p, unit, kind) }]);
  };

  useEffect(() => {
    const id = params.get("producto");
    const p = id && products.find((x) => x.id === id);
    if (p && !preloaded.current) { preloaded.current = true; add(p); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, products]);

  const update = (key: number, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const total = rows.reduce((n, r) => n + (Number(r.qty) || 0) * (Number(r.amount) || 0), 0);
  const allowNegative = business?.allow_negative_stock ?? false;
  const short = kind === "salida" && !allowNegative ? rows.filter((r) => baseQty(r) > Number(r.product.stock)) : [];

  const submit = () => {
    if (rows.length === 0) return toast("Agrega al menos un producto", { error: true });
    const bad = rows.find((r) => !(Number(r.qty) > 0));
    if (bad) return toast(`Indica la cantidad de ${bad.product.name}`, { error: true });
    if (short.length) return toast(`No hay stock suficiente de ${short[0].product.name}`, { error: true });
    register.mutate(
      {
        reason, supplier_id: supplier || null, party, reference, note,
        items: rows.map((r) => ({ product_id: r.product.id, quantity: Number(r.qty), unit: r.unit, ...(priced ? (kind === "entrada" ? { unit_cost: Number(r.amount) } : { unit_price: Number(r.amount) }) : {}) })),
      },
      { onSuccess: (doc) => { toast(`${kind === "entrada" ? "Entrada" : "Salida"} #${doc.number} registrada`); navigate(`/movimientos/${doc.id}`); }, onError: (e) => toast(e.message, { error: true }) },
    );
  };

  const Icon = kind === "entrada" ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <Page title={kind === "entrada" ? "Registrar entrada" : "Registrar salida"} icon={Icon} width="full"
      actions={<Button variant="primary" icon={Icon} onClick={submit} loading={register.isPending}>Guardar {kind}</Button>}>
      <Layout
        aside={
          <>
            <Card>
              <CardHeader title="Documento" />
              <div className="space-y-3">
                <Select label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} options={reasons[kind].map((r) => ({ value: r, label: reasonLabels[r] }))} />
                {(kind === "entrada" ? reason === "compra" : reason === "devolucion_proveedor") && (
                  <Select label="Proveedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Sin proveedor" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
                )}
                {kind === "salida" && reason !== "devolucion_proveedor" && (
                  <TextField label={reason === "venta" ? "Cliente u obra" : "Destino / responsable"} value={party} onChange={(e) => setParty(e.target.value)} placeholder="Opcional" />
                )}
                <TextField label={kind === "entrada" ? "Factura o guía" : "Boleta, factura o guía"} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="F001-000123" />
                <TextArea label="Nota" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Resumen" />
              <p className="text-ink-secondary">{rows.length} productos</p>
              {priced && <p className="mt-1 text-[24px] font-[650] tabular-nums">{formatMoney(total)}</p>}
              {priced && <p className="text-[12px] text-ink-tertiary">{kind === "entrada" ? "Costo total de la compra" : "Total de la venta"}</p>}
            </Card>
          </>
        }
      >
        <Card>
          <ProductPicker onPick={add} />
          {rows.length === 0 ? (
            <p className="py-12 text-center text-ink-secondary">Busca los productos por código, nombre, marca o medida y presiona Enter.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {rows.map((r) => {
                const p = r.product;
                const after = Number(p.stock) + (kind === "entrada" ? 1 : -1) * baseQty(r);
                const isShort = short.includes(r);
                return (
                  <li key={r.key} className="grid items-end gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_110px_150px_130px_110px_auto]">
                    <div className="min-w-0 self-center">
                      <p className="truncate font-[550]"><span className="mr-2 font-mono text-[12px] text-ink-tertiary">{p.code}</span>{productLabel(p)}</p>
                      <p className={cn("text-[12px]", isShort ? "font-[550] text-critical-strong" : "text-ink-secondary")}>
                        Stock {formatQty(p.stock, p.unit)} → {formatQty(after, p.unit)}{isShort && " · stock insuficiente"}
                      </p>
                    </div>
                    <TextField label="Cantidad" type="number" min="0" step="any" value={r.qty} onChange={(e) => update(r.key, { qty: e.target.value })} />
                    {p.pack_unit && Number(p.pack_size) > 1 ? (
                      <Select label="Unidad" value={r.unit} onChange={(e) => {
                        const unit = e.target.value as Row["unit"];
                        update(r.key, { unit, amount: defaultAmount(p, unit, kind) });
                      }} options={[{ value: "base", label: p.unit }, { value: "pack", label: `${p.pack_unit} (${formatQty(p.pack_size)} ${p.unit})` }]} />
                    ) : <TextField label="Unidad" value={p.unit} disabled />}
                    {priced ? (
                      <TextField label={`${amountLabel} por ${r.unit === "pack" ? p.pack_unit : p.unit}`} type="number" min="0" step="0.01" prefix="S/" value={r.amount}
                        onChange={(e) => update(r.key, { amount: e.target.value })} />
                    ) : <div className="hidden sm:block" />}
                    <p className="pb-1.5 text-right font-[550] tabular-nums">{priced ? formatMoney((Number(r.qty) || 0) * (Number(r.amount) || 0)) : `${formatQty(baseQty(r), p.unit)}`}</p>
                    <Button variant="plain" size="icon" icon={Trash2} onClick={() => setRows(rows.filter((x) => x.key !== r.key))} className="mb-0.5">Quitar</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        {kind === "entrada" && reason === "compra" && <Banner tone="info">El costo de cada producto se actualiza con el promedio ponderado del stock actual y lo que entra.</Banner>}
      </Layout>
    </Page>
  );
}
