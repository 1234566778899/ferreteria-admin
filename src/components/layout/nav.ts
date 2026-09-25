import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, ClipboardList, FileText, Home, Package, Settings, Store, Tags, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/types";

export type NavItem = { label: string; to: string; icon: LucideIcon; end?: boolean; roles?: Role[] };

/** Menú principal. `roles` limita quién lo ve (por defecto, todos). */
export const mainNav: NavItem[] = [
  { label: "Inicio", to: "/", icon: Home, end: true, roles: ["admin"] },
  { label: "Productos", to: "/productos", icon: Package },
  { label: "Registrar entrada", to: "/entradas/nueva", icon: ArrowDownToLine },
  { label: "Registrar salida", to: "/salidas/nueva", icon: ArrowUpFromLine },
  { label: "Conteo físico", to: "/conteo", icon: ClipboardCheck },
  { label: "Movimientos", to: "/movimientos", icon: FileText },
  { label: "Kardex", to: "/kardex", icon: ClipboardList },
];

export const settingsNav: NavItem[] = [
  { label: "Ferretería", to: "/configuracion", icon: Store, end: true },
  { label: "Usuarios", to: "/configuracion/usuarios", icon: Users },
  { label: "Categorías", to: "/configuracion/categorias", icon: Tags },
  { label: "Proveedores", to: "/configuracion/proveedores", icon: Truck },
];

export const settingsIcon = Settings;
