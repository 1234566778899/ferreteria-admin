import { ClipboardCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Banner, Button, Card, cn, Modal, Page, Select, TextArea, useToast } from "@/components/ui";
import { formatQty, normalize } from "@/lib/format";
import { useCategories, useProducts, useRegisterCount } from "@/modules/products/api";
import { productLabel, searchProducts } from "@/modules/products/search";

/** Toma de inventario: se digita lo contado y se ajusta solo lo que difiere. */
export function CountPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const register = useRegisterCount();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [counted, setCounted] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");

  const locations = useMemo(() => [...new Set(data.map((p) => p.location).filter(Boolean) as string[])].sort(), [data]);
  const rows = useMemo(() => searchProducts(data.filter((p) => p.is_active && (!category || p.category_id === category) && (!location || p.location === location)), search)
    .sort((a, b) => normalize(a.location ?? "").localeCompare(normalize(b.location ?? "")) || a.name.localeCompare(b.name, "es")), [data, category, location, search]);

  const entered = data.filter((p) => counted[p.id] !== undefined && counted[p.id] !== "");
  const diffs = entered.filter((p) => Number(counted[p.id]) !== Number(p.stock));

  const apply = () => register.mutate(
    { note, items: entered.map((p) => ({ product_id: p.id, counted: Number(counted[p.id]) })) },
    {
      onSuccess: (doc) => {
        setConfirming(false);
        setCounted({});
        if (doc) { toast(`Conteo aplicado: ${doc.line_count} ajustes`); navigate(`/movimientos/${doc.id}`); }
        else toast("Todo cuadra: no hubo diferencias");
      },
      onError: (e) => toast(e.message, { error: true }),
    },
  );

  return (
    <Page icon={ClipboardCheck} title="Conteo físico" width="full"
      actions={<Button variant="primary" disabled={entered.length === 0} onClick={() => setConfirming(true)}>Aplicar conteo ({diffs.length} diferencias)</Button>}>
      <Banner tone="info">Cuenta por pasillo o categoría y escribe la cantidad real. Solo se ajustan los productos que tengan diferencia; lo que dejes vacío no cambia.</Banner>
      <div className="my-3 flex flex-wrap items-center gap-2">
        <Select hideLabel label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Todas las categorías" className="w-56" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <Select hideLabel label="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Todas las ubicaciones" className="w-48" options={locations.map((l) => ({ value: l, label: l }))} />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto" aria-label="Buscar producto"
          className="h-[30px] w-full max-w-[280px] rounded-[10px] bg-white px-3 shadow-field outline-none focus:shadow-[0_0_0_2px_var(--color-brand)]" />
        <span className="ml-auto text-ink-secondary">{entered.length} contados · {rows.length} en la lista</span>
      </div>
      <Card padded={false}>
        <table className="w-full text-left">
          <thead>
            <tr className="h-9 border-b border-border bg-surface-muted text-[12px] text-ink-secondary">
              <th className="pl-4">Ubicación</th><th>Producto</th><th className="text-right">En sistema</th><th className="w-40 text-right">Contado</th><th className="pr-4 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const v = counted[p.id];
              const diff = v === undefined || v === "" ? null : Number(v) - Number(p.stock);
              return (
                <tr key={p.id} className={cn("h-11 border-b border-border last:border-0", diff !== null && diff !== 0 && "bg-warning-soft/40")}>
                  <td className="pl-4 whitespace-nowrap text-ink-secondary">{p.location ?? "—"}</td>
                  <td><span className="mr-2 font-mono text-[12px] text-ink-tertiary">{p.code}</span><span className="font-[550]">{productLabel(p)}</span></td>
                  <td className="text-right tabular-nums whitespace-nowrap">{formatQty(p.stock, p.unit)}</td>
                  <td className="text-right">
                    <input type="number" min="0" step="any" inputMode="decimal" value={v ?? ""} aria-label={`Contado de ${p.name}`}
                      onChange={(e) => setCounted({ ...counted, [p.id]: e.target.value })}
                      className="h-8 w-32 rounded-[8px] bg-white px-2 text-right tabular-nums shadow-field outline-none focus:shadow-[0_0_0_2px_var(--color-brand)]" />
                  </td>
                  <td className={cn("pr-4 text-right font-[550] tabular-nums whitespace-nowrap", diff === null ? "text-ink-tertiary" : diff === 0 ? "text-success" : diff > 0 ? "text-info" : "text-critical-strong")}>
                    {diff === null ? "—" : diff === 0 ? "Cuadra" : `${diff > 0 ? "+" : ""}${formatQty(diff, p.unit)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Aplicar conteo"
        primaryAction={{ label: diffs.length ? `Ajustar ${diffs.length} productos` : "Confirmar", loading: register.isPending, onClick: apply }}>
        {diffs.length === 0 ? <p className="text-ink-secondary">Los {entered.length} productos contados cuadran con el sistema.</p> : (
          <ul className="mb-3 max-h-64 divide-y divide-border overflow-y-auto">
            {diffs.map((p) => {
              const diff = Number(counted[p.id]) - Number(p.stock);
              return (
                <li key={p.id} className="flex justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate">{productLabel(p)}</span>
                  <span className={cn("shrink-0 font-[550] tabular-nums", diff > 0 ? "text-info" : "text-critical-strong")}>{diff > 0 ? "+" : ""}{formatQty(diff, p.unit)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <TextArea label="Nota" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. conteo pasillo C, 25 set." />
      </Modal>
    </Page>
  );
}
