-- =============================================================================
-- Panel de inventario (solo administradores). Fechas en hora de Lima.
-- =============================================================================
create or replace function public.inv_dashboard(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := internal.today();
  v_from date := internal.today() - (greatest(coalesce(p_days, 30), 1) - 1);
  v_dead int := coalesce((select dead_stock_days from public.business limit 1), 90);
begin
  perform internal.assert_admin();
  return jsonb_build_object(
    'days', p_days,
    'totals', (select jsonb_build_object(
        'products', count(*), 'value_cost', coalesce(sum(value_cost), 0), 'value_price', coalesce(sum(value_price), 0),
        'out', count(*) filter (where is_out), 'low', count(*) filter (where is_low),
        'dead', count(*) filter (where stock > 0 and (last_exit_at is null or last_exit_at < now() - make_interval(days => v_dead))),
        'dead_value', coalesce(sum(value_cost) filter (where stock > 0 and (last_exit_at is null or last_exit_at < now() - make_interval(days => v_dead))), 0))
      from public.product_stock where is_active),
    'dead_days', v_dead,
    -- Entradas y salidas valorizadas a costo, por día.
    'series', (select jsonb_agg(jsonb_build_object('date', d::date, 'entradas', coalesce(t.e, 0), 'salidas', coalesce(t.s, 0)) order by d)
               from generate_series(v_from, v_today, interval '1 day') d
               left join (select (m.created_at at time zone 'America/Lima')::date dd,
                                 round(sum(m.quantity * m.unit_cost) filter (where d.kind = 'entrada'), 2) e,
                                 round(sum(-m.quantity * m.unit_cost) filter (where d.kind = 'salida'), 2) s
                          from public.stock_movement m join public.stock_doc d on d.id = m.doc_id
                          where d.voided_at is null and (m.created_at at time zone 'America/Lima')::date between v_from and v_today group by 1) t on t.dd = d::date),
    'period', (select jsonb_build_object(
        'entries_cost', coalesce(sum(total_cost) filter (where kind = 'entrada'), 0),
        'exits_cost', coalesce(sum(total_cost) filter (where kind = 'salida'), 0),
        'sales', coalesce(sum(total_price) filter (where kind = 'salida' and reason = 'venta'), 0),
        'sales_cost', coalesce(sum(total_cost) filter (where kind = 'salida' and reason = 'venta'), 0),
        'losses', coalesce(sum(total_cost) filter (where kind = 'salida' and reason = 'merma'), 0),
        'docs', count(*))
      from public.stock_doc where voided_at is null and (created_at at time zone 'America/Lima')::date between v_from and v_today),
    'top_exits', (select coalesce(jsonb_agg(x order by x.value desc), '[]') from (
        select p.id, p.code, p.name, p.brand, p.model, p.unit, sum(-m.quantity) as quantity, round(sum(-m.quantity * coalesce(m.unit_price, m.unit_cost)), 2) as value
        from public.stock_movement m join public.stock_doc d on d.id = m.doc_id join public.product p on p.id = m.product_id
        where d.kind = 'salida' and d.voided_at is null and (m.created_at at time zone 'America/Lima')::date between v_from and v_today
        group by p.id order by 7 desc limit 8) x),
    'low', (select coalesce(jsonb_agg(x order by x.stock), '[]') from (
        select id, code, name, brand, model, unit, stock, min_stock, supplier_name from public.product_stock
        where is_active and (is_out or is_low) order by is_out desc, stock / nullif(min_stock, 0) nulls first limit 12) x),
    'dead', (select coalesce(jsonb_agg(x order by x.value_cost desc), '[]') from (
        select id, code, name, brand, model, unit, stock, value_cost, last_exit_at from public.product_stock
        where is_active and stock > 0 and (last_exit_at is null or last_exit_at < now() - make_interval(days => v_dead))
        order by value_cost desc limit 10) x),
    'by_category', (select coalesce(jsonb_agg(x order by x.value desc), '[]') from (
        select coalesce(category_name, 'Sin categoría') as name, coalesce(category_color, '#8a8a8a') as color, sum(value_cost) as value, count(*) as products
        from public.product_stock where is_active group by 1, 2) x),
    'recent', (select coalesce(jsonb_agg(x order by x.created_at desc), '[]') from (
        select id, number, kind, reason, reference, party, supplier_name, total_cost, total_price, line_count, created_at, user_name, voided_at
        from public.doc_list order by created_at desc limit 8) x)
  );
end $$;
