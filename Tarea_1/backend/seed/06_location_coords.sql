-- =============================================================================
-- 06_location_coords.sql
-- Patch NO destructivo: agrega coordenadas (geonodos) a la tabla location SIN
-- regenerar ordenes ni el resto de datos transaccionales.
--
-- Cuando usar:
--   * Si ya tienes una BD poblada (con su warehouse construido) y NO quieres
--     volver a correr 05_transactional.sql (que regenera las 240 ordenes).
--
-- En instalaciones nuevas no hace falta: 05_transactional.sql ya inserta las
-- mismas coordenadas. Este script es idempotente (se puede correr varias veces).
--
-- Aplicar:
--   Get-Content backend\seed\06_location_coords.sql -Encoding UTF8 |
--     docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db
-- =============================================================================

SET client_encoding TO 'UTF8';

-- Por si la API (synchronize) aun no creo las columnas.
ALTER TABLE location ADD COLUMN IF NOT EXISTS latitude  double precision;
ALTER TABLE location ADD COLUMN IF NOT EXISTS longitude double precision;

UPDATE location AS l
SET latitude = c.lat, longitude = c.lon
FROM (VALUES
  (1,  9.9356, -84.0792),
  (2,  9.9189, -84.1378),
  (3,  9.8990, -84.0668),
  (4,  9.9197, -84.0556),
  (5,  9.9489, -84.1228),
  (6,  9.9389, -84.0889),
  (7,  9.9300, -84.0875),
  (8,  9.9280, -84.0739),
  (9,  9.9100, -84.0561),
  (10, 9.9583, -84.1242),
  (11, 9.9344, -84.1011),
  (12, 9.9136, -84.1011),
  (13, 9.9039, -84.0889),
  (14, 9.9211, -84.1497),
  (15, 9.9311, -84.1281),
  (16, 9.8869, -84.0606),
  (17, 9.8908, -84.0758),
  (18, 9.7711, -84.0061),
  (19, 9.8589, -84.0917),
  (20, 9.9075, -84.0331),
  (21, 9.9203, -84.0181),
  (22, 9.9483, -84.0561),
  (23, 9.9456, -84.0703),
  (24, 9.9286, -84.0506),
  (25, 9.9389, -84.0331),
  (26, 9.9325, -84.1839),
  (27, 9.9011, -84.1003),
  (28, 9.9558, -84.0875),
  (29, 9.9589, -84.0500),
  (30, 9.9678, -84.0094)
) AS c(id, lat, lon)
WHERE l.id = c.id;

-- Verificacion rapida
SELECT id, name, latitude, longitude FROM location ORDER BY id;
