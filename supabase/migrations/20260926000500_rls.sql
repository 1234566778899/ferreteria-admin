-- =============================================================================
-- Seguridad (RLS)
--   personal activo: lee todo; registra entradas, salidas y conteos por RPC
--   administrador: además edita productos, categorías, proveedores, negocio y personal; anula documentos
--   el stock solo cambia por los workflows (trigger guard_stock + sin políticas de escritura en movimientos)
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['business', 'staff', 'category', 'supplier', 'product', 'stock_doc', 'stock_movement'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  foreach t in array array['business', 'category', 'supplier', 'product', 'stock_doc', 'stock_movement'] loop
    execute format('create policy staff_read on public.%I for select to authenticated using (internal.is_staff())', t);
  end loop;
  foreach t in array array['category', 'supplier', 'product'] loop
    execute format('create policy admin_write on public.%I for all to authenticated using (internal.is_admin()) with check (internal.is_admin())', t);
  end loop;
end $$;

create policy admin_update on public.business for update to authenticated using (internal.is_admin()) with check (internal.is_admin());
create policy self_read on public.staff for select to authenticated using (user_id = auth.uid() or internal.is_admin());
create policy admin_manage on public.staff for update to authenticated using (internal.is_admin() and user_id <> auth.uid()) with check (internal.is_admin());
create policy admin_remove on public.staff for delete to authenticated using (internal.is_admin() and user_id <> auth.uid());

grant execute on function public.has_owner() to anon, authenticated;
revoke execute on function public.inv_dashboard(int) from anon;
revoke all on public.doc_list, public.movement_list from anon;

insert into public.business (id) values (true) on conflict do nothing;
