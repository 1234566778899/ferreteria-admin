# Ferretería · Inventario

Control de inventario para una **ferretería en Perú** (por ahora solo inventario, sin punto de venta): productos con unidad base y presentación, entradas, salidas, conteo físico, kardex y un panel con valor del inventario, stock bajo y productos sin movimiento.

- Stack: Vite 8 + React 19 + TypeScript + Tailwind 4 + TanStack Query 5 + React Router 8 (modo data, rutas lazy) + Supabase. Iconos lucide, gráficos recharts.
- El diseño viene de `../botica-pos` (y este del admin de `../cielo-online/admin`): mismos componentes propios en `src/components/ui`, tokens en `src/index.css`. No uses Polaris. Marca naranja `#c2410c`. Gráfico de entradas/salidas: `#2563eb` / `#e8590c` (validados con el script de dataviz).
- Credenciales del proyecto de Supabase (desarrollo) en `CLAUDE.local.md` (en `.gitignore`, nunca copiarlas a archivos versionados). La app solo usa la publishable key (`.env.local`).

## Comandos

```bash
npm run dev      # http://localhost:5183 (5180 admin Cielo, 5181 botica, 5174 otra app del usuario)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
supabase db push --db-url '<cadena del pooler en CLAUDE.local.md>'   # aplica supabase/migrations
psql '<cadena>' -f supabase/seed.sql                                  # datos de ejemplo (solo base vacía)
```

## Dominio

- **Unidad base y presentación.** El stock (`product.stock`, `numeric(14,3)`) se guarda en la unidad base (`und`, `m`, `kg`, `gal`, `bolsa`, `varilla`…) y admite decimales, por ejemplo 12.5 m de cable. Opcionalmente hay una presentación (`pack_unit` + `pack_size`, como un rollo de 100 m) para comprar o vender por rollo; los RPC reciben `unit: 'base' | 'pack'` y convierten.
- **Precios con IGV incluido**, por unidad base (`price`); `price_pack` si la presentación tiene otro precio. El costo (`cost`) es **promedio ponderado** y se recalcula en cada entrada con costo. El admin también puede editarlo a mano.
- **Todo cambio de stock es un documento** (`stock_doc`: entrada, salida o ajuste, con un motivo) con líneas en `stock_movement`, que son el kardex (cantidad con signo y saldo).
  - Motivos de entrada: compra, inventario_inicial, devolucion_cliente.
  - Motivos de salida: venta, consumo_interno, merma, devolucion_proveedor.
  - Ajuste: conteo, o la reversa de una anulación.
- **El stock no se puede editar directo**: el trigger `internal.guard_stock` lo bloquea salvo dentro de `internal.apply_line` (que activa `app.stock_rpc`). El stock inicial de un producto nuevo se registra con una entrada "Inventario inicial".
- **Anular** (solo admin) crea un ajuste que revierte las líneas y marca el documento `voided_at`. No recalcula el costo promedio.
- Por defecto no se permite stock negativo (`business.allow_negative_stock`). "Sin movimiento" significa con stock y sin salidas en `business.dead_stock_days` días (90).
- **Roles:**
  - `almacenero`: ve productos, registra entradas, salidas y conteos, ve movimientos y kardex; no ve costos.
  - `admin`: además ve el panel, los costos y la utilidad, edita productos y precios, anula documentos y gestiona usuarios, categorías y proveedores.
  - El primer usuario ejecuta `bootstrap_owner`; los demás piden acceso con `request_access` y un admin los aprueba.
- **Fechas en hora de Lima**: en SQL `internal.today()` y `created_at at time zone 'America/Lima'`, nunca `current_date`, porque Supabase corre en UTC. En el front, `todayLima()`.

## Reglas de código

- Escrituras con lógica por RPC `security definer` con validación de rol:
  - `inv_entry`, `inv_exit`, `inv_count` (personal activo).
  - `inv_void_doc`, `inv_dashboard` (admin).
  - Para lectura también `inv_doc`.
  - Las funciones `internal.register_*` aceptan `created_at` (solo para el seed); las públicas lo descartan.
- Catálogo (product, category, supplier): el admin lo escribe directo, protegido por RLS. Documentos y movimientos no tienen políticas de escritura.
- Vistas: `product_stock` es `security_invoker`; `doc_list` y `movement_list` corren como dueño (para leer staff) y filtran con `internal.is_staff()`.
- Supabase activa **pg-safeupdate**: todo UPDATE/DELETE necesita WHERE, incluso dentro de funciones (`update business … where id = true`). El Postgres local de pruebas no lo tiene.
- Un cambio de esquema es una **nueva** migración; no edites las aplicadas.
- UI en español de Perú: montos con `formatMoney` ("S/ 1,259.90"), cantidades con `formatQty` / `formatStock`, productos con `productLabel` ("Cemento Portland Tipo I · Sol · Bolsa 42.5 kg").
