-- =============================================================================
-- 05_transactional.sql
-- Datos transaccionales de ejemplo para alimentar el pipeline analitico
-- (Spark -> Hive). Genera usuarios, restaurantes, menus, platos y ~240 ordenes
-- con fechas y horas distribuidas para que los analisis OLAP tengan sentido:
--   * Horarios pico  -> ordenes concentradas en almuerzo (11-14h) y cena (18-21h)
--   * Crecimiento mensual -> mas ordenes en meses recientes
--   * Completadas vs canceladas -> mezcla realista de estados
--
-- Requisitos previos (ya cargados por seed.ps1): role, status, country,
-- province, canton, district.
--
-- Se puede re-ejecutar sin problemas: primero limpia las tablas transaccionales.
-- Nota: se usan nombres SIN acentos a proposito para evitar problemas de
-- codificacion al pipear el archivo a psql desde PowerShell.
-- =============================================================================

SET client_encoding TO 'UTF8';

-- --- Limpieza (hijos primero por las llaves foraneas) -----------------------
DELETE FROM order_item;
DELETE FROM "order";
DELETE FROM plate;
DELETE FROM menu;
DELETE FROM restaurant;
DELETE FROM location;
DELETE FROM category;
DELETE FROM "user";

-- --- Categorias de producto -------------------------------------------------
INSERT INTO category (id, name) VALUES
  (1, 'Entradas'),
  (2, 'Platos Fuertes'),
  (3, 'Postres'),
  (4, 'Bebidas'),
  (5, 'Ensaladas'),
  (6, 'Sopas');

-- --- Ubicaciones (zonas geograficas) ----------------------------------------
-- district_id referencia distritos ya cargados desde el CSV (existen cientos).
-- latitude/longitude son coordenadas reales aproximadas (geonodos) del area
-- metropolitana de San Jose; sirven para calcular distancias Haversine y
-- simular rutas de entrega en Neo4j (no son aleatorias -> reproducibles).
INSERT INTO location (id, name, district_id, latitude, longitude) VALUES
  (1,  'Centro San Jose',   10101, 9.9356, -84.0792), -- Carmen
  (2,  'Escazu',            10201, 9.9189, -84.1378), -- Escazu
  (3,  'Desamparados',      10301, 9.8990, -84.0668),
  (4,  'Zapote',            10105, 9.9197, -84.0556),
  (5,  'Pavas',             10109, 9.9489, -84.1228),
  (6,  'Merced',            10102, 9.9389, -84.0889),
  (7,  'Hospital',          10103, 9.9300, -84.0875),
  (8,  'Catedral',          10104, 9.9280, -84.0739),
  (9,  'San Francisco de Dos Rios', 10106, 9.9100, -84.0561),
  (10, 'Uruca',             10107, 9.9583, -84.1242),
  (11, 'Mata Redonda',      10108, 9.9344, -84.1011),
  (12, 'Hatillo',           10110, 9.9136, -84.1011),
  (13, 'San Sebastian',     10111, 9.9039, -84.0889),
  (14, 'San Antonio (Escazu)', 10202, 9.9211, -84.1497),
  (15, 'San Rafael (Escazu)',  10203, 9.9311, -84.1281),
  (16, 'San Miguel (Desamparados)', 10302, 9.8869, -84.0606),
  (17, 'San Juan de Dios',  10303, 9.8908, -84.0758),
  (18, 'Frailes',           10306, 9.7711, -84.0061),
  (19, 'Aserri',            10601, 9.8589, -84.0917),
  (20, 'Curridabat',        11801, 9.9075, -84.0331),
  (21, 'Granadilla',        11802, 9.9203, -84.0181),
  (22, 'Guadalupe',         10801, 9.9483, -84.0561),
  (23, 'San Francisco (Goicoechea)', 10802, 9.9456, -84.0703),
  (24, 'San Pedro (Montes de Oca)', 11501, 9.9286, -84.0506),
  (25, 'Sabanilla',         11502, 9.9389, -84.0331),
  (26, 'Santa Ana',         10901, 9.9325, -84.1839),
  (27, 'Alajuelita',        11001, 9.9011, -84.1003),
  (28, 'Tibas (Cinco Esquinas)', 11302, 9.9558, -84.0875),
  (29, 'Moravia (San Vicente)', 11401, 9.9589, -84.0500),
  (30, 'Vazquez de Coronado (San Isidro)', 11101, 9.9678, -84.0094);

-- --- Usuarios ---------------------------------------------------------------
-- id 1 = administrador (role 1). Resto = clientes (role 2).
INSERT INTO "user" (id, keycloak_id, first_name, last_name, email, is_active, created_at, role_id) VALUES
  (1,  'kc-admin-001', 'Admin',   'Principal', 'admin@resto.com',     true,  '2025-08-01 09:00:00', 1),
  (2,  'kc-user-002',  'Carlos',  'Jimenez',   'carlos@mail.com',     true,  '2025-08-10 10:15:00', 2),
  (3,  'kc-user-003',  'Maria',   'Rodriguez', 'maria@mail.com',      true,  '2025-08-18 11:30:00', 2),
  (4,  'kc-user-004',  'Jose',    'Vargas',    'jose@mail.com',       true,  '2025-09-02 14:00:00', 2),
  (5,  'kc-user-005',  'Ana',     'Mora',      'ana@mail.com',        true,  '2025-09-15 16:45:00', 2),
  (6,  'kc-user-006',  'Luis',    'Castro',    'luis@mail.com',       true,  '2025-10-01 12:20:00', 2),
  (7,  'kc-user-007',  'Sofia',   'Solano',    'sofia@mail.com',      true,  '2025-10-20 18:05:00', 2),
  (8,  'kc-user-008',  'Diego',   'Araya',     'diego@mail.com',      true,  '2025-11-05 19:30:00', 2),
  (9,  'kc-user-009',  'Laura',   'Cordero',   'laura@mail.com',      true,  '2025-11-25 13:10:00', 2),
  (10, 'kc-user-010',  'Pedro',   'Rojas',     'pedro@mail.com',      true,  '2025-12-10 20:00:00', 2),
  (11, 'kc-user-011',  'Valeria', 'Nunez',     'valeria@mail.com',    true,  '2026-01-15 11:00:00', 2),
  (12, 'kc-user-012',  'Andres',  'Quiros',    'andres@mail.com',     true,  '2026-02-01 12:45:00', 2);

-- --- Restaurantes -----------------------------------------------------------
INSERT INTO restaurant (id, name, created_at, location_id, admin_id) VALUES
  (1, 'Soda La Tablita',        '2025-08-05 10:00:00', 1, 1),
  (2, 'Restaurante Sabor Tico', '2025-08-08 10:00:00', 2, 1),
  (3, 'El Fogon Criollo',       '2025-08-12 10:00:00', 3, 1);

-- --- Menus (uno por restaurante) --------------------------------------------
INSERT INTO menu (id, name, restaurant_id) VALUES
  (1, 'Menu Principal - La Tablita', 1),
  (2, 'Menu Principal - Sabor Tico', 2),
  (3, 'Menu Principal - El Fogon',   3);

-- --- Platos (precios en colones) --------------------------------------------
INSERT INTO plate (id, name, price, description, menu_id, category_id) VALUES
  (1,  'Casado con Pollo',   3500, 'Arroz, frijoles, ensalada y pollo',   1, 2),
  (2,  'Casado con Carne',   4200, 'Arroz, frijoles, ensalada y carne',   1, 2),
  (3,  'Gallo Pinto',        2500, 'Arroz y frijoles con natilla',        1, 1),
  (4,  'Arroz con Pollo',    3800, 'Clasico arroz con pollo tico',        1, 2),
  (5,  'Ceviche de Pescado', 4500, 'Pescado fresco en limon',             1, 1),
  (6,  'Sopa Negra',         2800, 'Sopa de frijoles con huevo',          1, 6),
  (7,  'Tres Leches',        2200, 'Postre humedo de tres leches',        2, 3),
  (8,  'Flan de Coco',       2000, 'Flan casero de coco',                 2, 3),
  (9,  'Batido de Mora',     1800, 'Batido natural de mora',              2, 4),
  (10, 'Cafe Chorreado',     1200, 'Cafe tradicional chorreado',          2, 4),
  (11, 'Ensalada Cesar',     3200, 'Lechuga, crotones y aderezo cesar',   2, 5),
  (12, 'Ensalada Tropical',  3000, 'Mix de frutas y vegetales',           2, 5),
  (13, 'Olla de Carne',      5200, 'Caldo de carne con vegetales',        3, 6),
  (14, 'Chifrijo',           3900, 'Frijoles, chicharron y pico de gallo',3, 1),
  (15, 'Patacones',          2600, 'Platano verde frito',                 3, 1),
  (16, 'Pollo a la Plancha', 4400, 'Pechuga a la plancha con guarnicion', 3, 2),
  (17, 'Pescado Entero',     6500, 'Pescado frito entero',                3, 2),
  (18, 'Limonada Natural',   1500, 'Limonada con o sin soda',             3, 4);

-- --- Ordenes ----------------------------------------------------------------
-- Genera 240 ordenes con generate_series. Cada random() pre-calculado en la
-- subconsulta para controlar la distribucion de fecha/hora/estado/etc.
INSERT INTO "order" (id, pickup, created_at, location_id, status_id, user_id, restaurant_id)
SELECT
  s.g,
  (s.r_pickup < 0.5),
  (
    -- Fecha base 2025-09-01 + hasta 280 dias, sesgada hacia fechas recientes
    -- (power > 0 con base random sesga la distribucion) -> crecimiento mensual
    DATE '2025-09-01'
      + (floor(power(s.r_day, 0.7) * 280))::int
    -- Hora del dia: 40% almuerzo (11-14h), 35% cena (18-21h), 25% resto
      + (
          CASE
            WHEN s.r_hour < 0.40 THEN 11 + floor(s.r_h2 * 4)::int
            WHEN s.r_hour < 0.75 THEN 18 + floor(s.r_h2 * 4)::int
            ELSE floor(s.r_h2 * 24)::int
          END
        ) * INTERVAL '1 hour'
      + (floor(s.r_min * 60)::int) * INTERVAL '1 minute'
  )::timestamp,
  1 + floor(s.r_loc * 5)::int,                 -- location 1..5
  -- Estado: 65% Completed, 13% Delivered, 10% Cancelled, 7% Confirmed, 5% Pending
  CASE
    WHEN s.r_status < 0.65 THEN 13
    WHEN s.r_status < 0.78 THEN 22
    WHEN s.r_status < 0.88 THEN 12
    WHEN s.r_status < 0.95 THEN 11
    ELSE 10
  END,
  2 + floor(s.r_user * 11)::int,               -- user 2..12 (clientes)
  1 + floor(s.r_rest * 3)::int                 -- restaurant 1..3
FROM (
  SELECT g,
    random() AS r_pickup, random() AS r_day,  random() AS r_hour,
    random() AS r_h2,     random() AS r_min,  random() AS r_loc,
    random() AS r_status, random() AS r_user, random() AS r_rest
  FROM generate_series(1, 240) AS g
) AS s;

-- --- Detalle de ordenes (order_item) ----------------------------------------
-- Cada orden tiene 1 a 3 items. El primer item siempre existe; el 2do y 3ro
-- son probabilisticos. plate_id sesgado hacia ids bajos -> unos platos son
-- mas populares que otros (interesante para "tendencias de consumo").
INSERT INTO order_item (id, quantity, order_id, plate_id)
SELECT
  row_number() OVER (ORDER BY o.id, k.k)                  AS id,
  1 + floor(power(random(), 1.5) * 4)::int               AS quantity,   -- 1..4 sesgado bajo
  o.id                                                   AS order_id,
  1 + floor(power(random(), 1.8) * 18)::int              AS plate_id    -- 1..18 sesgado bajo
FROM "order" o
CROSS JOIN generate_series(1, 3) AS k(k)
WHERE k.k = 1 OR random() < 0.55;

-- --- Reiniciar las secuencias de IDs ----------------------------------------
-- Como insertamos IDs explicitos, hay que avanzar las secuencias para que la
-- API pueda seguir creando registros sin colisiones de llave primaria.
SELECT setval(pg_get_serial_sequence('category',    'id'), (SELECT MAX(id) FROM category));
SELECT setval(pg_get_serial_sequence('location',    'id'), (SELECT MAX(id) FROM location));
SELECT setval(pg_get_serial_sequence('"user"',      'id'), (SELECT MAX(id) FROM "user"));
SELECT setval(pg_get_serial_sequence('restaurant',  'id'), (SELECT MAX(id) FROM restaurant));
SELECT setval(pg_get_serial_sequence('menu',        'id'), (SELECT MAX(id) FROM menu));
SELECT setval(pg_get_serial_sequence('plate',       'id'), (SELECT MAX(id) FROM plate));
SELECT setval(pg_get_serial_sequence('"order"',     'id'), (SELECT MAX(id) FROM "order"));
SELECT setval(pg_get_serial_sequence('order_item',  'id'), (SELECT MAX(id) FROM order_item));

-- --- Resumen ----------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM "user")      AS usuarios,
  (SELECT COUNT(*) FROM plate)       AS platos,
  (SELECT COUNT(*) FROM "order")     AS ordenes,
  (SELECT COUNT(*) FROM order_item)  AS items;
