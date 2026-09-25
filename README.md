# Ferretería · Inventario

Control de inventario para ferreterías (Perú): productos con unidad base y presentación (m / rollo, und / caja, kg), entradas y salidas con costo promedio, conteo físico, kardex y panel con valor del inventario, stock bajo y productos sin movimiento.

## Puesta en marcha

1. Aplica la base de datos en tu proyecto de Supabase:
   ```bash
   supabase db push --db-url "postgresql://postgres.<ref>:<password>@<pooler>:5432/postgres"
   psql "<misma conexión>" -f supabase/seed.sql   # opcional: datos de ejemplo
   ```
2. Copia `.env.example` a `.env.local` con la URL y la **publishable key**.
3. `npm install && npm run dev` → http://localhost:5183
4. Crea tu cuenta. El primer usuario configura la ferretería y queda como administrador; el resto pide acceso y se aprueba en **Configuración → Usuarios**.

## Despliegue en Vercel

Importa el repositorio (Vite se detecta; `vercel.json` ya redirige las rutas a `index.html`) y define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (solo la publishable key). En Supabase → Authentication → URL Configuration agrega el dominio de Vercel como Site URL y en Redirect URLs.

## Pantallas

| Pantalla | Qué hace |
|---|---|
| **Inicio** (admin) | Valor del inventario a costo y a precio, ventas y compras del periodo, agotados, stock bajo, sin movimiento, entradas/salidas por día, valor por categoría. |
| **Productos** | Catálogo con stock, mínimo, costo, precio, valor y última salida; vistas rápidas y exportación a CSV (Excel). |
| **Registrar entrada / salida** | Buscador por código, nombre, marca o medida; cantidad en unidad base o presentación; costo o precio; stock resultante antes de guardar. |
| **Conteo físico** | Por categoría o ubicación: se digita lo contado y solo se ajustan las diferencias. |
| **Movimientos** | Todos los documentos con filtros; detalle, impresión y anulación (admin). |
| **Kardex** | Entradas, salidas y saldo por producto. |
| **Configuración** (admin) | Datos del negocio, stock negativo, días "sin movimiento", usuarios, categorías y proveedores. |
