import { Ban, Printer } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { useBusiness } from "@/components/layout/AppFrame";
import { Badge, Banner, Button, Card, CardHeader, Layout, Modal, Page, Skeleton, TextArea, useToast } from "@/components/ui";
import { formatDateTime, formatMoney, formatQty, kindLabels, reasonLabels } from "@/lib/format";
import { useIsAdmin } from "@/modules/auth/AuthProvider";
import { useDoc, useVoidDoc } from "@/modules/products/api";
import { kindTone } from "./tones";

export function DocDetailPage() {
  const { id } = useParams();
  const { data: doc, isLoading, error } = useDoc(id);
  const { data: business } = useBusiness();
  const isAdmin = useIsAdmin();
  const voidDoc = useVoidDoc();
  const toast = useToast();
  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");

  const crumbs = [{ label: "Movimientos", to: "/movimientos" }];
  if (isLoading) return <Page title="Documento" breadcrumbs={crumbs}><Skeleton className="h-80" /></Page>;
  if (error || !doc) return <Page title="Documento" breadcrumbs={crumbs}><Banner tone="critical">{error?.message ?? "Documento no encontrado"}</Banner></Page>;

  const isSale = doc.reason === "venta";
  const showCost = isAdmin && !isSale;
  return (
    <Page title={`${kindLabels[doc.kind]} #${doc.number}`} breadcrumbs={crumbs} largeTitle width="default"
      titleMeta={<>{doc.voided_at ? <Badge tone="critical">Anulado</Badge> : <Badge tone={kindTone[doc.kind]}>{reasonLabels[doc.reason]}</Badge>}</>}
      subtitle={`${formatDateTime(doc.created_at)}${doc.user_name ? ` · ${doc.user_name}` : ""}`}
      actions={
        <>
          <Button icon={Printer} onClick={() => window.print()}>Imprimir</Button>
          {isAdmin && !doc.voided_at && doc.reason !== "conteo" && <Button variant="critical" icon={Ban} onClick={() => setVoiding(true)}>Anular</Button>}
        </>
      }>
      {/* Encabezado solo al imprimir */}
      <img src="/logo.png" alt={business?.name ?? ""} className="mb-4 hidden h-14 w-auto print:block" />
      {doc.voided_at && <div className="mb-4"><Banner tone="critical" title="Documento anulado">{formatDateTime(doc.voided_at)} · {doc.void_reason}. El stock se revirtió con un ajuste.</Banner></div>}
      <Layout
        aside={
          <Card>
            <CardHeader title="Datos" />
            <dl className="space-y-2">
              <div><dt className="text-[12px] text-ink-secondary">Negocio</dt><dd>{business?.name}</dd></div>
              {doc.supplier_name && <div><dt className="text-[12px] text-ink-secondary">Proveedor</dt><dd>{doc.supplier_name}</dd></div>}
              {doc.party && <div><dt className="text-[12px] text-ink-secondary">{isSale ? "Cliente / obra" : "Destino"}</dt><dd>{doc.party}</dd></div>}
              {doc.reference && <div><dt className="text-[12px] text-ink-secondary">Documento</dt><dd>{doc.reference}</dd></div>}
              {doc.note && <div><dt className="text-[12px] text-ink-secondary">Nota</dt><dd>{doc.note}</dd></div>}
            </dl>
          </Card>
        }
      >
        <Card padded={false}>
          <table className="w-full text-left">
            <thead>
              <tr className="h-9 border-b border-border bg-surface-muted text-[12px] text-ink-secondary">
                <th className="pl-4">Producto</th><th className="text-right">Cantidad</th>
                {(showCost || isSale) && <th className="text-right">{isSale ? "Precio" : "Costo"}</th>}
                {(showCost || isSale) && <th className="text-right">Subtotal</th>}
                <th className="pr-4 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l) => {
                const unitAmount = isSale ? Number(l.unit_price ?? 0) : Number(l.unit_cost);
                return (
                  <tr key={l.id} className="h-12 border-b border-border last:border-0">
                    <td className="pl-4">
                      <Link to={`/productos/${l.product_id}`} className="font-[550] hover:underline">{l.product_name}</Link>
                      <p className="text-[12px] text-ink-secondary">{[l.code, l.brand, l.model].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className={`text-right font-[550] tabular-nums whitespace-nowrap ${Number(l.quantity) > 0 ? "text-success" : "text-critical-strong"}`}>
                      {Number(l.quantity) > 0 ? "+" : ""}{formatQty(l.quantity, l.unit)}
                      {l.entered_unit && l.entered_unit !== l.unit && <span className="block text-[11px] font-normal text-ink-tertiary">{formatQty(l.entered_quantity)} {l.entered_unit}</span>}
                    </td>
                    {(showCost || isSale) && <td className="text-right tabular-nums">{formatMoney(unitAmount)}</td>}
                    {(showCost || isSale) && <td className="text-right tabular-nums">{formatMoney(Math.abs(Number(l.quantity)) * unitAmount)}</td>}
                    <td className="pr-4 text-right text-ink-secondary tabular-nums">{formatQty(l.balance, l.unit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(showCost || isSale) && (
            <div className="flex justify-between border-t border-border px-4 py-3 text-[15px] font-[650]">
              <span>Total</span><span className="tabular-nums">{formatMoney(isSale ? doc.total_price : doc.total_cost)}</span>
            </div>
          )}
        </Card>
      </Layout>

      <Modal open={voiding} onClose={() => setVoiding(false)} title={`Anular ${kindLabels[doc.kind].toLowerCase()} #${doc.number}`} size="sm"
        primaryAction={{
          label: "Anular", destructive: true, loading: voidDoc.isPending, disabled: !reason.trim(),
          onClick: () => voidDoc.mutate({ id: doc.id, reason }, { onSuccess: () => { toast("Documento anulado y stock revertido"); setVoiding(false); }, onError: (e) => toast(e.message, { error: true }) }),
        }}>
        <p className="mb-3 text-ink-secondary">Se registrará un ajuste que revierte cada línea. No se puede deshacer.</p>
        <TextArea label="Motivo" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. se registró dos veces" />
      </Modal>
    </Page>
  );
}
