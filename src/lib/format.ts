const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "S/ 1,259.90" */
export const formatMoney = (value: number | string | null | undefined) => {
  const n = Math.round(Number(value ?? 0) * 100) / 100;
  return `${n < 0 ? "−" : ""}S/ ${money.format(Math.abs(n))}`;
};

const tz = "America/Lima";
const dateFmt = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: tz });
const shortDateFmt = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: tz });
const dateTimeFmt = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: tz });
const timeFmt = new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit", timeZone: tz });

export const formatDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const formatShortDate = (iso: string) => shortDateFmt.format(new Date(iso));
export const formatDateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
/** Hoy en Lima como "2026-09-25" (para filtros de fecha). */
export const todayLima = () => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
export const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const fullName = (first?: string | null, last?: string | null) => [first, last].filter(Boolean).join(" ").trim();
export const pluralize = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Minúsculas y sin tildes, para buscar "ibuprofeno" = "Ibuprofeno". */
export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Cantidad con decimales solo si hacen falta: 12, 12.5, 0.125. */
const qtyFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
export const formatQty = (n: number | string | null | undefined, unit?: string | null) => `${qtyFmt.format(Number(n ?? 0))}${unit ? ` ${unit}` : ""}`;

/** Stock en unidad base y, si hay presentación, su equivalencia: "1,095.5 m (10.9 rollos)". */
export function formatStock(stock: number, unit: string, packUnit?: string | null, packSize = 1) {
  const base = formatQty(stock, unit);
  if (!packUnit || packSize <= 1 || Math.abs(stock) < packSize) return base;
  const packs = Math.floor((stock / packSize) * 10) / 10;
  return `${base} (${qtyFmt.format(packs)} ${packs >= 2 ? plural(packUnit) : packUnit})`;
}

/** "rollo" → "rollos", "millar" → "millares". */
export const plural = (w: string) => (/[aeiou]$/i.test(w) ? `${w}s` : /s$/i.test(w) ? w : `${w}es`);

/** Unidades de medida frecuentes en ferretería (se puede escribir otra). */
export const units = ["und", "m", "kg", "gal", "lt", "bolsa", "varilla", "par", "juego", "pliego", "plancha", "rollo", "caja", "paquete", "m²", "m³", "millar", "ciento"];

export const reasonLabels: Record<string, string> = {
  compra: "Compra", inventario_inicial: "Inventario inicial", devolucion_cliente: "Devolución de cliente",
  venta: "Venta", consumo_interno: "Consumo interno", merma: "Merma", devolucion_proveedor: "Devolución a proveedor",
  conteo: "Conteo físico", otro: "Otro",
};
export const kindLabels: Record<string, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" };

