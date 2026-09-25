-- =============================================================================
-- Datos de ejemplo: ferretería en Lima con ~70 productos y 60 días de movimientos.
-- Solo sobre una base vacía. Para empezar de cero, ver CLAUDE.md ("limpiar datos").
-- =============================================================================
update public.business set name = coalesce(nullif(name, 'Mi Ferretería'), 'Ferretería El Constructor') where id = true;

insert into public.category (name, color, rank) values
  ('Construcción', '#8a6d3b', 1), ('Fierros y alambres', '#5a6f8f', 2), ('Gasfitería', '#2aa7c9', 3), ('Electricidad', '#e0a030', 4),
  ('Pinturas', '#d85a9c', 5), ('Herramientas manuales', '#c2410c', 6), ('Herramientas eléctricas', '#7b4fd6', 7),
  ('Tornillería y fijación', '#6b7a8f', 8), ('Cerrajería', '#3f7a52', 9), ('Adhesivos y selladores', '#b0782a', 10), ('Seguridad', '#e25c5c', 11);

insert into public.supplier (name, ruc, phone, email, contact) values
  ('Distribuidora Ferretera Lima SAC', '20512345671', '01 614 2200', 'ventas@dferretera.pe', 'Jorge Ramos'),
  ('Comercial Cementos y Fierros del Norte', '20487654322', '01 715 3301', 'pedidos@cemfier.pe', 'María Torres'),
  ('Importadora Eléctrica Andina', '20555666773', '01 330 4455', 'compras@ielectrica.pe', 'Luis Paredes'),
  ('Pinturas y Acabados Perú', '20601112224', '01 442 7788', 'ventas@pinturasperu.pe', 'Rosa Huamán');

-- código, nombre, marca, modelo, categoría, proveedor, unidad, presentación, tamaño, costo, precio, precio presentación,
-- stock mínimo, ubicación, stock inicial, salida máx. típica
create temp table seed_product (code text, name text, brand text, model text, cat text, sup text, unit text, pack_unit text, pack_size numeric,
  cost numeric, price numeric, price_pack numeric, min_stock numeric, location text, initial numeric, qmax numeric);
insert into seed_product values
  ('CEM-001','Cemento Portland Tipo I','Sol','Bolsa 42.5 kg','Construcción','Comercial Cementos y Fierros del Norte','bolsa',null,1,26.50,30.50,null,40,'Patio A',150,8),
  ('CEM-002','Cemento Portland Tipo I','Andino','Bolsa 42.5 kg','Construcción','Comercial Cementos y Fierros del Norte','bolsa',null,1,25.80,29.50,null,20,'Patio A',80,6),
  ('CEM-003','Cemento Extraforte','Sol','Bolsa 42.5 kg','Construcción','Comercial Cementos y Fierros del Norte','bolsa',null,1,27.90,32.00,null,15,'Patio A',50,4),
  ('CON-001','Yeso cerámico','Chema','Bolsa 25 kg','Construcción','Distribuidora Ferretera Lima SAC','bolsa',null,1,9.50,13.00,null,10,'Patio A',40,3),
  ('CON-002','Ladrillo King Kong 18 huecos','Lark','24 x 13 x 9 cm','Construcción','Comercial Cementos y Fierros del Norte','und','millar',1000,0.62,0.85,780.00,1000,'Patio B',6000,400),
  ('CON-003','Pegamento para cerámico','Celima','Bolsa 25 kg','Construcción','Distribuidora Ferretera Lima SAC','bolsa',null,1,14.50,19.90,null,10,'Patio A',40,4),
  ('FIE-001','Fierro corrugado','Aceros Arequipa','1/2" x 9 m','Fierros y alambres','Comercial Cementos y Fierros del Norte','varilla',null,1,36.00,41.50,null,50,'Patio C',200,15),
  ('FIE-002','Fierro corrugado','Aceros Arequipa','3/8" x 9 m','Fierros y alambres','Comercial Cementos y Fierros del Norte','varilla',null,1,20.50,23.90,null,80,'Patio C',300,20),
  ('FIE-003','Fierro liso','Aceros Arequipa','1/4" x 9 m','Fierros y alambres','Comercial Cementos y Fierros del Norte','varilla',null,1,8.60,10.50,null,50,'Patio C',180,15),
  ('FIE-004','Fierro corrugado','Aceros Arequipa','5/8" x 9 m','Fierros y alambres','Comercial Cementos y Fierros del Norte','varilla',null,1,56.00,64.00,null,20,'Patio C',60,6),
  ('ALA-001','Alambre negro recocido','Prodac','N.° 16','Fierros y alambres','Comercial Cementos y Fierros del Norte','kg',null,1,5.20,6.50,null,50,'B-01',200,6),
  ('ALA-002','Alambre negro recocido','Prodac','N.° 8','Fierros y alambres','Comercial Cementos y Fierros del Norte','kg',null,1,5.00,6.20,null,30,'B-01',120,5),
  ('CLA-001','Clavo para madera','Prodac','2"','Fierros y alambres','Distribuidora Ferretera Lima SAC','kg',null,1,5.80,7.50,null,20,'B-02',120,3),
  ('CLA-002','Clavo para madera','Prodac','3"','Fierros y alambres','Distribuidora Ferretera Lima SAC','kg',null,1,5.60,7.20,null,20,'B-02',100,3),
  ('CLA-003','Clavo para calamina','Prodac','2 1/2"','Fierros y alambres','Distribuidora Ferretera Lima SAC','kg',null,1,8.00,10.50,null,10,'B-02',40,2),
  ('PVC-001','Tubo PVC agua fría clase 10','Pavco','1/2" x 5 m','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,7.20,9.50,null,20,'C-01',80,6),
  ('PVC-002','Tubo PVC agua fría clase 10','Pavco','3/4" x 5 m','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,10.40,13.50,null,15,'C-01',60,4),
  ('PVC-003','Tubo PVC desagüe','Pavco','4" x 3 m','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,22.00,28.50,null,10,'C-01',40,3),
  ('PVC-004','Tubo PVC desagüe','Pavco','2" x 3 m','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,11.50,15.00,null,10,'C-01',40,4),
  ('PVC-005','Codo PVC 90° agua','Pavco','1/2"','Gasfitería','Distribuidora Ferretera Lima SAC','und','bolsa',10,0.80,1.30,11.00,40,'C-02',200,10),
  ('PVC-006','Tee PVC agua','Pavco','1/2"','Gasfitería','Distribuidora Ferretera Lima SAC','und','bolsa',10,0.95,1.50,13.00,30,'C-02',150,8),
  ('PVC-007','Pegamento para PVC','Oatey','1/32 gal','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,4.50,7.00,null,12,'C-03',48,3),
  ('GAS-001','Cinta teflón','Ferrefast','3/4" x 10 m','Gasfitería','Distribuidora Ferretera Lima SAC','und','caja',10,0.70,1.50,12.00,30,'C-03',150,6),
  ('GAS-002','Llave de paso PVC','Pavco','1/2"','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,6.50,9.50,null,8,'C-03',30,2),
  ('GAS-003','Grifo para lavatorio cromado','Vainsa','Monocomando','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,28.00,39.90,null,3,'C-04',12,1),
  ('GAS-004','Válvula esférica de bronce','Cim','1/2"','Gasfitería','Distribuidora Ferretera Lima SAC','und',null,1,14.50,21.00,null,5,'C-04',20,2),
  ('CAB-001','Cable THW','Indeco','14 AWG','Electricidad','Importadora Eléctrica Andina','m','rollo',100,1.25,1.80,150.00,200,'D-01',1000,30),
  ('CAB-002','Cable THW','Indeco','12 AWG','Electricidad','Importadora Eléctrica Andina','m','rollo',100,1.85,2.60,230.00,150,'D-01',800,25),
  ('CAB-003','Cable vulcanizado','Indeco','2 x 14 AWG','Electricidad','Importadora Eléctrica Andina','m','rollo',100,2.60,3.60,320.00,100,'D-01',500,15),
  ('ELE-001','Interruptor simple','Bticino','Modus','Electricidad','Importadora Eléctrica Andina','und',null,1,6.80,9.90,null,10,'D-02',40,3),
  ('ELE-002','Tomacorriente doble con línea a tierra','Bticino','Modus','Electricidad','Importadora Eléctrica Andina','und',null,1,8.50,12.50,null,10,'D-02',40,3),
  ('ELE-003','Foco LED luz blanca','Philips','9 W E27','Electricidad','Importadora Eléctrica Andina','und','caja',10,5.20,7.90,70.00,20,'D-03',100,4),
  ('ELE-004','Foco LED luz blanca','Philips','13 W E27','Electricidad','Importadora Eléctrica Andina','und',null,1,7.80,11.50,null,10,'D-03',50,3),
  ('ELE-005','Cinta aislante','3M','Temflex 19 mm x 18 m','Electricidad','Importadora Eléctrica Andina','und',null,1,2.40,3.90,null,20,'D-03',80,3),
  ('ELE-006','Llave termomagnética','Schneider','2 x 20 A','Electricidad','Importadora Eléctrica Andina','und',null,1,24.00,34.00,null,4,'D-04',15,1),
  ('ELE-007','Canaleta adhesiva','Dexson','20 x 12 mm x 2 m','Electricidad','Importadora Eléctrica Andina','und',null,1,3.10,4.80,null,15,'D-04',60,4),
  ('ELE-008','Extensión eléctrica 3 tomas','Force','3 m','Electricidad','Importadora Eléctrica Andina','und',null,1,12.50,19.90,null,4,'D-04',15,1),
  ('PIN-001','Pintura látex Vencelatex blanco','Vencedor','Galón','Pinturas','Pinturas y Acabados Perú','gal',null,1,28.00,38.90,null,10,'E-01',40,2),
  ('PIN-002','Pintura látex Duralatex blanco hueso','CPP','Galón','Pinturas','Pinturas y Acabados Perú','gal',null,1,31.00,42.90,null,8,'E-01',30,2),
  ('PIN-003','Esmalte sintético negro','Tekno','Galón','Pinturas','Pinturas y Acabados Perú','gal',null,1,48.00,64.90,null,3,'E-01',10,1),
  ('PIN-004','Thinner estándar','Tekno','Litro','Pinturas','Pinturas y Acabados Perú','lt',null,1,5.80,8.50,null,12,'E-02',48,3),
  ('PIN-005','Sellador para muros','CPP','Galón','Pinturas','Pinturas y Acabados Perú','gal',null,1,22.00,29.90,null,5,'E-01',20,1),
  ('PIN-006','Brocha','Tumi','2"','Pinturas','Pinturas y Acabados Perú','und',null,1,3.20,5.50,null,12,'E-03',48,3),
  ('PIN-007','Brocha','Tumi','4"','Pinturas','Pinturas y Acabados Perú','und',null,1,6.50,10.50,null,8,'E-03',30,2),
  ('PIN-008','Rodillo de felpa','Tumi','9"','Pinturas','Pinturas y Acabados Perú','und',null,1,8.50,13.90,null,6,'E-03',24,2),
  ('PIN-009','Lija para madera','Abralit','N.° 80','Pinturas','Pinturas y Acabados Perú','pliego','paquete',50,1.10,2.00,80.00,30,'E-04',200,6),
  ('HER-001','Martillo de uña','Stanley','16 oz','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,32.00,45.90,null,3,'F-01',12,1),
  ('HER-002','Wincha','Stanley','5 m','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,18.50,27.90,null,4,'F-01',15,1),
  ('HER-003','Desarmador plano','Stanley','1/4 x 6"','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,7.20,11.50,null,5,'F-01',20,2),
  ('HER-004','Alicate universal','Truper','8"','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,16.50,24.90,null,4,'F-02',15,1),
  ('HER-005','Llave Stilson','Truper','14"','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,38.00,55.00,null,2,'F-02',8,1),
  ('HER-006','Serrucho','Truper','20"','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,22.00,32.90,null,3,'F-02',10,1),
  ('HER-007','Nivel de aluminio','Truper','24"','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,21.00,32.00,null,3,'F-03',10,1),
  ('HER-008','Pala cuchara','Herragro','Mango de madera','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,26.00,38.00,null,3,'F-03',12,1),
  ('HER-009','Carretilla bugui','Truper','5 pies³','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,180.00,240.00,null,1,'Patio B',4,1),
  ('HER-010','Badilejo','Truper','8"','Herramientas manuales','Distribuidora Ferretera Lima SAC','und',null,1,9.00,14.50,null,4,'F-03',15,1),
  ('HEL-001','Taladro percutor','Bosch','GSB 13 RE 650 W','Herramientas eléctricas','Importadora Eléctrica Andina','und',null,1,210.00,289.00,null,1,'G-01',4,1),
  ('HEL-002','Amoladora angular','Bosch','GWS 750 4 1/2"','Herramientas eléctricas','Importadora Eléctrica Andina','und',null,1,220.00,299.00,null,1,'G-01',3,1),
  ('HEL-003','Disco de corte para metal','Bosch','4 1/2" x 1 mm','Herramientas eléctricas','Importadora Eléctrica Andina','und','caja',25,3.20,5.50,125.00,25,'G-02',150,5),
  ('HEL-004','Broca para concreto','Bosch','3/8"','Herramientas eléctricas','Importadora Eléctrica Andina','und',null,1,5.80,9.50,null,6,'G-02',25,2),
  ('TOR-001','Tornillo autorroscante punta broca','Ferrefast','8 x 1"','Tornillería y fijación','Distribuidora Ferretera Lima SAC','und','caja',100,0.06,0.10,8.00,500,'H-01',3000,100),
  ('TOR-002','Tornillo para drywall','Ferrefast','6 x 1"','Tornillería y fijación','Distribuidora Ferretera Lima SAC','und','caja',100,0.04,0.08,6.00,500,'H-01',3000,100),
  ('TOR-003','Tarugo plástico','Fischer','1/4"','Tornillería y fijación','Distribuidora Ferretera Lima SAC','und','bolsa',100,0.03,0.08,5.00,300,'H-02',2000,50),
  ('TOR-004','Perno hexagonal con tuerca','Ferrefast','3/8" x 2"','Tornillería y fijación','Distribuidora Ferretera Lima SAC','und',null,1,0.45,0.80,null,50,'H-02',300,20),
  ('TOR-005','Arandela plana','Ferrefast','3/8"','Tornillería y fijación','Distribuidora Ferretera Lima SAC','und',null,1,0.05,0.10,null,100,'H-02',600,30),
  ('CER-001','Candado de bronce','Forte','40 mm','Cerrajería','Distribuidora Ferretera Lima SAC','und',null,1,12.50,19.90,null,4,'I-01',15,1),
  ('CER-002','Cerradura para puerta principal','Forte','3 golpes','Cerrajería','Distribuidora Ferretera Lima SAC','und',null,1,45.00,69.90,null,2,'I-01',6,1),
  ('CER-003','Bisagra capuchina','Forte','3"','Cerrajería','Distribuidora Ferretera Lima SAC','par',null,1,3.20,5.50,null,10,'I-02',40,3),
  ('ADH-001','Silicona transparente','Sika','Sikasil 280 ml','Adhesivos y selladores','Distribuidora Ferretera Lima SAC','und',null,1,11.50,16.90,null,6,'I-03',24,2),
  ('ADH-002','Pegamento de contacto','Terokal','1/4 gal','Adhesivos y selladores','Distribuidora Ferretera Lima SAC','und',null,1,18.00,26.00,null,4,'I-03',15,1),
  ('SEG-001','Guantes de cuero','Steelpro','Talla única','Seguridad','Distribuidora Ferretera Lima SAC','par',null,1,6.50,10.50,null,10,'J-01',40,3),
  ('SEG-002','Lentes de seguridad claros','Steelpro','Antiempañante','Seguridad','Distribuidora Ferretera Lima SAC','und',null,1,4.20,7.50,null,8,'J-01',30,2),
  ('SEG-003','Casco de seguridad','Steelpro','Blanco con rachet','Seguridad','Distribuidora Ferretera Lima SAC','und',null,1,12.00,19.90,null,3,'J-01',10,1);

insert into public.product (code, name, brand, model, category_id, supplier_id, unit, pack_unit, pack_size, cost, price, price_pack, min_stock, location)
select s.code, s.name, s.brand, s.model, (select id from public.category where name = s.cat), (select id from public.supplier where name = s.sup),
       s.unit, s.pack_unit, s.pack_size, s.cost, s.price, s.price_pack, s.min_stock, s.location
from seed_product s;

-- Inventario inicial hace 60 días.
select internal.register_entry(jsonb_build_object('reason', 'inventario_inicial', 'reference', 'INV-INICIAL', 'note', 'Conteo de apertura',
  'created_at', ((internal.today() - 60)::timestamp + interval '8 hours') at time zone 'America/Lima',
  'items', (select jsonb_agg(jsonb_build_object('product_id', p.id, 'quantity', s.initial, 'unit', 'base', 'unit_cost', s.cost) order by s.code)
            from seed_product s join public.product p on p.code = s.code)), null);

-- 60 días de operación: ventas diarias, compras semanales para reponer y alguna merma.
do $$
declare
  d int;
  k int;
  v_items jsonb;
  r record;
  v_ts timestamptz;
  v_dead text[] := array['CER-002', 'HER-009', 'HEL-002', 'ELE-006', 'PIN-003', 'GAS-003', 'SEG-003', 'HER-005'];   -- sin salidas: "sin movimiento"
begin
  perform setseed(0.31);
  for d in reverse 59..0 loop
    -- Compra de reposición los lunes y jueves.
    if extract(dow from internal.today() - d) in (1, 4) then
      for r in select sp.name as sup, sp.id as sup_id from public.supplier sp loop
        select jsonb_agg(jsonb_build_object('product_id', p.id, 'unit', 'base',
                 'quantity', greatest(s.min_stock * 3 - p.stock, s.min_stock),
                 'unit_cost', round(s.cost * (0.97 + random() * 0.08)::numeric, 4)))
          into v_items
        from public.product p join seed_product s on s.code = p.code
        where s.sup = r.sup and p.stock < s.min_stock * 1.3 and not (p.code = any (v_dead)) and p.code not in ('ELE-004', 'GAS-004');
        if v_items is not null then
          perform internal.register_entry(jsonb_build_object('reason', 'compra', 'supplier_id', r.sup_id,
            'reference', 'F001-' || lpad((3000 + d * 7 + floor(random() * 7))::text, 6, '0'),
            'created_at', ((internal.today() - d)::timestamp + interval '9 hours') at time zone 'America/Lima', 'items', v_items), null);
        end if;
      end loop;
    end if;

    -- Ventas del día (menos los domingos).
    for k in 1..(case when extract(dow from internal.today() - d) = 0 then 2 else 5 + floor(random() * 7)::int end) loop
      v_ts := ((internal.today() - d)::timestamp + make_interval(hours => 8 + floor(random() * 11)::int, mins => floor(random() * 60)::int)) at time zone 'America/Lima';
      if v_ts > now() then continue; end if;
      select jsonb_agg(jsonb_build_object('product_id', x.id, 'unit', 'base',
               'quantity', case when x.unit in ('kg', 'm') then round((0.5 + random() * x.qmax)::numeric * 2) / 2 else 1 + floor(random() * x.qmax) end))
        into v_items
      from (select p.id, p.unit, s.qmax from public.product p join seed_product s on s.code = p.code
            where not (p.code = any (v_dead)) and p.stock > s.qmax order by random() limit 1 + floor(random() * random() * 4)::int) x;
      if v_items is null then continue; end if;
      begin
        perform internal.register_exit(jsonb_build_object('reason', 'venta', 'reference', 'B001-' || lpad((d * 20 + k)::text, 6, '0'),
          'created_at', v_ts, 'items', v_items), null);
      exception when others then null;
      end;
    end loop;

    -- Merma ocasional (bolsa de cemento rota, foco dañado).
    if d % 17 = 5 then
      perform internal.register_exit(jsonb_build_object('reason', 'merma', 'note', 'Bolsa rota en descarga',
        'created_at', ((internal.today() - d)::timestamp + interval '10 hours') at time zone 'America/Lima',
        'items', jsonb_build_array(jsonb_build_object('product_id', (select id from public.product where code = 'CEM-001'), 'quantity', 1))), null);
    end if;
  end loop;
end $$;

-- Dos productos quedan bajo el mínimo (no se repusieron).
select internal.register_exit(jsonb_build_object('reason', 'venta', 'reference', 'B001-999001', 'party', 'Obra Los Olivos',
  'items', (select jsonb_agg(jsonb_build_object('product_id', id, 'quantity', greatest(stock - min_stock + 1, 1))) from public.product where code in ('ELE-004', 'GAS-004'))), null);
drop table seed_product;
