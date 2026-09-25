-- =============================================================================
-- Catálogo de la ferretería
-- El stock se guarda en la UNIDAD BASE del producto (und, m, kg, gal…) y admite
-- decimales (3,5 m de cable). Opcionalmente se compra/vende en una presentación
-- mayor (rollo de 100 m, caja de 100 und, bolsa de 42,5 kg): pack_unit + pack_size.
-- =============================================================================

create table public.category (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#c2410c',
  rank int not null default 0,
  created_at timestamptz not null default now()
);

create table public.supplier (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ruc text,
  phone text,
  email text,
  contact text,
  created_at timestamptz not null default now()
);

create table public.product (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                    -- código interno / SKU
  barcode text unique,
  name text not null,                           -- "Cemento Portland Tipo I"
  brand text,                                   -- "Sol"
  model text,                                   -- medida o modelo: "42.5 kg", "1/2\"", "14 AWG"
  category_id uuid references public.category (id) on delete set null,
  supplier_id uuid references public.supplier (id) on delete set null,   -- proveedor habitual
  unit text not null default 'und',             -- unidad base: und, m, kg, gal, lt, bolsa, par…
  pack_unit text,                               -- presentación mayor: caja, rollo, bolsa, paquete…
  pack_size numeric(12, 3) not null default 1 check (pack_size > 0),
  cost numeric(12, 4) not null default 0 check (cost >= 0),    -- costo promedio por unidad base
  price numeric(12, 2) not null default 0 check (price >= 0),  -- precio de venta por unidad base (IGV incl.)
  price_pack numeric(12, 2) check (price_pack >= 0),           -- precio por presentación (si difiere)
  stock numeric(14, 3) not null default 0,      -- solo lo cambian los movimientos (ver trigger)
  min_stock numeric(14, 3) not null default 0,
  location text,                                -- pasillo / estante
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_category_idx on public.product (category_id);
create index product_search_idx on public.product using gin ((internal.norm(code || ' ' || name || ' ' || coalesce(brand, '') || ' ' || coalesce(model, ''))) extensions.gin_trgm_ops);
create trigger product_updated_at before update on public.product for each row execute function internal.set_updated_at();

-- El stock solo cambia por un movimiento (kardex). Editar el producto no puede tocarlo.
create or replace function internal.guard_stock() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.stock <> 0 and coalesce(current_setting('app.stock_rpc', true), '') <> 'on' then
    raise exception 'El stock inicial se registra con una entrada (inventario inicial)';
  end if;
  if tg_op = 'UPDATE' and new.stock is distinct from old.stock and coalesce(current_setting('app.stock_rpc', true), '') <> 'on' then
    raise exception 'El stock solo cambia con entradas, salidas o conteos';
  end if;
  return new;
end $$;
create trigger product_guard_stock before insert or update on public.product for each row execute function internal.guard_stock();
