import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Banner, Button, Card, CardHeader, Layout, Page, Select, Skeleton, TextArea, TextField, useToast } from "@/components/ui";
import { formatDateTime, formatMoney, formatQty, formatStock, kindLabels, reasonLabels, units } from "@/lib/format";
import { useIsAdmin } from "@/modules/auth/AuthProvider";
import { useCategories, useMovements, useProduct, useSaveProduct, useSuppliers, type ProductDraft } from "./api";

const blank: ProductDraft = {
  code: "", barcode: "", name: "", brand: "", model: "", category_id: null, supplier_id: null, unit: "und", pack_unit: "", pack_size: 1,
  cost: 0, price: 0, price_pack: null, min_stock: 0, location: "", notes: "", is_active: true,
};

function RecentMovements({ productId, unit }: { productId: string; unit: string }) {
  const { data } = useMovements({ productId, page: 1, pageSize: 12 });
  if (!data?.rows.length) return <p className="px-4 pb-4 text-ink-secondary">Sin movimientos todavía.</p>;
  return (
    <div className="overflow-x-auto">
    <table className="w-full border-t border-border text-left">
      <thead><tr className="h-9 bg-surface-muted text-[12px] text-ink-secondary"><th className="pl-4">Fecha</th><th className="px-3">Documento</th><th className="px-3 max-md:hidden">Motivo</th><th className="px-3 text-right">Cantidad</th><th className="pr-4 pl-3 text-right">Saldo</th></tr></thead>
      <tbody>
        {data.rows.map((m) => (
          <tr key={m.id} className="h-10 border-t border-border">
            <td className="pl-4 whitespace-nowrap max-sm:text-[12px]">{formatDateTime(m.created_at)}</td>
            <td className="px-3 whitespace-nowrap"><Link to={`/movimientos/${m.doc_id}`} className="text-brand hover:underline">{kindLabels[m.kind]} #{m.doc_number}</Link>{m.voided_at && <Badge tone="critical" className="ml-1">Anulado</Badge>}</td>
            <td className="px-3 text-ink-secondary max-md:hidden">{reasonLabels[m.reason]}{m.party ? ` · ${m.party}` : ""}</td>
            <td className={`px-3 text-right font-[550] tabular-nums whitespace-nowrap ${Number(m.quantity) > 0 ? "text-success" : "text-critical-strong"}`}>{Number(m.quantity) > 0 ? "+" : ""}{formatQty(m.quantity)}</td>
            <td className="pr-4 pl-3 text-right tabular-nums whitespace-nowrap">{formatQty(m.balance, unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "nuevo";
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const { data: product, isLoading } = useProduct(isNew ? undefined : id);
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const save = useSaveProduct();
  const [d, setD] = useState<ProductDraft>(blank);

  useEffect(() => {
    if (product) {
      const { category_name: _a, category_color: _b, supplier_name: _c, value_cost: _d, value_price: _e, margin: _f, is_out: _g, is_low: _h,
        last_entry_at: _i, last_exit_at: _j, created_at: _k, stock: _l, ...rest } = product;
      setD({ ...blank, ...rest, pack_unit: rest.pack_unit ?? "" });
    }
  }, [product]);

  const crumbs = [{ label: "Productos", to: "/productos" }];
  if (!isNew && isLoading) return <Page title="Producto" breadcrumbs={crumbs}><Skeleton className="h-96" /></Page>;

  const set = (patch: Partial<ProductDraft>) => setD({ ...d, ...patch });
  const text = (k: keyof ProductDraft) => ({ value: (d[k] as string | null) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ [k]: e.target.value }), disabled: !isAdmin });
  const num = (k: keyof ProductDraft) => ({ type: "number", min: "0", step: "any", value: (d[k] as number | null) ?? "", disabled: !isAdmin,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set({ [k]: e.target.value === "" ? null : Number(e.target.value) }) });
  const margin = Number(d.price) > 0 ? Math.round((1 - Number(d.cost) / Number(d.price)) * 1000) / 10 : null;
  const hasPack = Boolean(d.pack_unit?.trim());

  const submit = () => {
    if (!d.code.trim() || !d.name.trim()) return toast("Completa el código y el nombre", { error: true });
    if (hasPack && !(Number(d.pack_size) > 1)) return toast("Indica cuántas unidades trae la presentación", { error: true });
    save.mutate(d, {
      onSuccess: (newId) => { toast(isNew ? "Producto creado" : "Producto guardado"); if (isNew) navigate(`/productos/${newId}`, { replace: true }); },
      onError: (e) => toast(e.message, { error: true }),
    });
  };

  return (
    <Page title={isNew ? "Nuevo producto" : d.name} breadcrumbs={crumbs} largeTitle
      titleMeta={product && (product.is_out ? <Badge tone="critical">Agotado</Badge> : product.is_low ? <Badge tone="warning">Stock bajo</Badge> : null)}
      subtitle={product ? [product.code, product.brand, product.model].filter(Boolean).join(" · ") : undefined}
      actions={
        <>
          {!isNew && <Button icon={ArrowDownToLine} to={`/entradas/nueva?producto=${id}`}>Entrada</Button>}
          {!isNew && <Button icon={ArrowUpFromLine} to={`/salidas/nueva?producto=${id}`}>Salida</Button>}
          {isAdmin && <Button variant="primary" onClick={submit} loading={save.isPending}>Guardar</Button>}
        </>
      }>
      {!isAdmin && <div className="mb-4"><Banner tone="info">Solo un administrador puede editar productos.</Banner></div>}
      <Layout
        aside={
          <>
            {product && (
              <Card>
                <CardHeader title="Stock" />
                <p className="text-[24px] font-[650] tabular-nums">{formatQty(product.stock, product.unit)}</p>
                {product.pack_unit && Number(product.pack_size) > 1 && <p className="text-ink-secondary">{formatStock(Number(product.stock), product.unit, product.pack_unit, Number(product.pack_size))}</p>}
                <p className="mt-2 text-ink-secondary">Mínimo {formatQty(product.min_stock, product.unit)}</p>
                {isAdmin && <p className="text-ink-secondary">Valor {formatMoney(product.value_cost)} a costo · {formatMoney(product.value_price)} a precio</p>}
                <p className="mt-2 text-[12px] text-ink-tertiary">El stock cambia solo con entradas, salidas o conteos.</p>
              </Card>
            )}
            <Card>
              <CardHeader title="Organización" />
              <div className="space-y-3">
                <Select label="Estado" value={d.is_active ? "1" : "0"} onChange={(e) => set({ is_active: e.target.value === "1" })} disabled={!isAdmin}
                  options={[{ value: "1", label: "Activo" }, { value: "0", label: "Inactivo (descontinuado)" }]} />
                <Select label="Categoría" value={d.category_id ?? ""} onChange={(e) => set({ category_id: e.target.value || null })} placeholder="Sin categoría" disabled={!isAdmin}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                <Select label="Proveedor habitual" value={d.supplier_id ?? ""} onChange={(e) => set({ supplier_id: e.target.value || null })} placeholder="Sin proveedor" disabled={!isAdmin}
                  options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
                <TextField label="Ubicación" {...text("location")} placeholder="Pasillo 3 · Estante B" />
              </div>
            </Card>
          </>
        }
      >
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Código" required {...text("code")} placeholder="CEM-001" help="Único; también sirve para buscar." />
            <TextField label="Código de barras" {...text("barcode")} placeholder="Opcional" />
            <TextField label="Nombre" required className="sm:col-span-2" {...text("name")} placeholder="Cemento Portland Tipo I" />
            <TextField label="Marca" {...text("brand")} placeholder="Sol" />
            <TextField label="Medida / modelo" {...text("model")} placeholder='Bolsa 42.5 kg, 1/2", 14 AWG' />
          </div>
        </Card>

        <Card>
          <CardHeader title="Unidades" description="El stock se lleva en la unidad base. La presentación es opcional (rollo de 100 m, caja de 100 und)." />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField label="Unidad base" list="units" required {...text("unit")} help="und, m, kg, gal, bolsa…" />
            <TextField label="Presentación" list="units" {...text("pack_unit")} placeholder="rollo, caja…" />
            {hasPack && <TextField label={`${d.unit || "unidades"} por ${d.pack_unit}`} {...num("pack_size")} />}
          </div>
          <datalist id="units">{units.map((u) => <option key={u} value={u} />)}</datalist>
        </Card>

        <Card>
          <CardHeader title="Precios" description="Precios con IGV incluido, por unidad base." />
          <div className="grid gap-3 sm:grid-cols-3">
            {isAdmin && <TextField label={`Costo por ${d.unit || "unidad"}`} prefix="S/" {...num("cost")} help="Se actualiza solo (promedio) con cada compra." />}
            <TextField label={`Precio por ${d.unit || "unidad"}`} prefix="S/" {...num("price")} help={isAdmin && margin !== null ? `Margen ${margin} %` : undefined} />
            {hasPack && (
              <TextField label={`Precio por ${d.pack_unit}`} prefix="S/" {...num("price_pack")}
                placeholder={(Number(d.price) * Number(d.pack_size || 1)).toFixed(2)} help="Vacío = unidad × cantidad." />
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <TextField label={`Stock mínimo (${d.unit || "und"})`} {...num("min_stock")} help="Avisa “stock bajo” al llegar aquí." />
          </div>
        </Card>

        <Card>
          <TextArea label="Notas" rows={2} value={d.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} disabled={!isAdmin} placeholder="Equivalencias, observaciones…" />
          {isNew && <p className="mt-3 text-ink-secondary">Después de crearlo, registra su stock con una entrada “Inventario inicial”.</p>}
        </Card>

        {!isNew && product && (
          <Card padded={false}>
            <div className="px-4 pt-4"><CardHeader title="Últimos movimientos" actions={<Button variant="plain" to={`/kardex?producto=${product.id}`}>Ver kardex</Button>} /></div>
            <RecentMovements productId={product.id} unit={product.unit} />
          </Card>
        )}
      </Layout>
    </Page>
  );
}
