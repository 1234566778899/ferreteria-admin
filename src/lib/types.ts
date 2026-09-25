export type Role = "admin" | "almacenero";

export type Staff = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type Business = {
  name: string;
  ruc: string | null;
  address: string | null;
  phone: string | null;
  allow_negative_stock: boolean;
  dead_stock_days: number;
};

export type Category = { id: string; name: string; color: string; rank: number };
export type Supplier = { id: string; name: string; ruc: string | null; phone: string | null; email: string | null; contact: string | null };

export type Product = {
  id: string;
  code: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  category_id: string | null;
  supplier_id: string | null;
  unit: string;
  pack_unit: string | null;
  pack_size: number;
  cost: number;
  price: number;
  price_pack: number | null;
  stock: number;
  min_stock: number;
  location: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

/** Fila de la vista product_stock. */
export type ProductStock = Product & {
  category_name: string | null;
  category_color: string | null;
  supplier_name: string | null;
  value_cost: number;
  value_price: number;
  margin: number | null;
  is_out: boolean;
  is_low: boolean;
  last_entry_at: string | null;
  last_exit_at: string | null;
};

export type DocKind = "entrada" | "salida" | "ajuste";
export type DocReason =
  | "compra" | "inventario_inicial" | "devolucion_cliente"
  | "venta" | "consumo_interno" | "merma" | "devolucion_proveedor"
  | "conteo" | "otro";

export type StockDoc = {
  id: string;
  number: number;
  kind: DocKind;
  reason: DocReason;
  supplier_id: string | null;
  supplier_name: string | null;
  party: string | null;
  reference: string | null;
  note: string | null;
  line_count: number;
  total_cost: number;
  total_price: number;
  user_name: string | null;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
};

export type DocLine = {
  id: string;
  product_id: string;
  code: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  unit: string;
  quantity: number;
  balance: number;
  unit_cost: number;
  unit_price: number | null;
  entered_quantity: number | null;
  entered_unit: string | null;
};

export type DocDetail = StockDoc & { lines: DocLine[] };

export type MovementRow = DocLine & {
  doc_id: string;
  doc_number: number;
  kind: DocKind;
  reason: DocReason;
  reference: string | null;
  party: string | null;
  voided_at: string | null;
  user_name: string | null;
  created_at: string;
};
