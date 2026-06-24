# Track C — Visualización con Metabase

Guía para levantar **Metabase** y construir los **3 dashboards obligatorios** del
proyecto.

---

## 🆕 0. Decisión vigente (Proyecto 2): dashboards desde el Data Warehouse (Hive)

> **Para el PDF:** esta sección reemplaza el enfoque original. Antes los dashboards
> se armaban a mano sobre Postgres. Ahora se sirven desde el **Data Warehouse (Hive)**
> y se provisionan **automáticamente** con un script. Las secciones 1–9 de abajo
> quedan como **referencia del fallback manual sobre Postgres**.

**Qué cambió y por qué:**
- Los dashboards leen los **cubos OLAP** (`restaurante_olap.*`) que el ETL de Spark
  genera en Hive. Así el DW deja de ser decorativo y los dashboards valen igual con
  `DB_TYPE=postgres` o `DB_TYPE=mongo` (el cubo es neutral a la fuente).
- Metabase trae el driver **SparkSQL integrado** (uno de sus 18 drivers oficiales):
  **no hace falta ningún `.jar`** ni montar `/plugins`. Conecta por el protocolo
  Thrift de HiveServer2 a `hive-server:10000`, base `restaurante_olap`.
- Para no armar nada a mano en el video (y porque se hace `down -v` seguido), todo
  se recrea con **`metabase/provision_metabase.py`**: conexión + 9 preguntas + 3
  dashboards, idempotente. Ver `metabase/README.md`.

**Mapeo dashboard ↔ cubo OLAP:**

| Dashboard | Gráficos (cubo) |
|---|---|
| Ingresos por mes y categoría | `olap_ingresos_mes_categoria`, `olap_ingresos_categoria` |
| Actividad de clientes por zona | `olap_actividad_geografica` (mapa de pines + barras) |
| Estadísticas de pedidos | `olap_pedidos_estado`, `olap_pedidos_mes_estado` |

**Cómo correrlo (resumen):**
```powershell
# db + hive + ETL + metabase ya arriba (ver metabase/README.md)
pip install requests
python metabase/provision_metabase.py
```

**Fallback:** si en alguna máquina el driver SparkSQL no logra hablar con
HiveServer2, el script avisa en `validar_conexion()`. Alternativa: servir los mismos
dashboards desde Postgres con el SQL de las secciones 5–7 (abajo), o apuntar el
script a un mart Postgres (`MB_DB_ENGINE=postgres`).

---

> ⬇️ **Lo de abajo (secciones 1–9) es el camino manual sobre Postgres**, conservado
> como fallback y como referencia del SQL de cada gráfico.

---

## 1. ¿Por qué Postgres y no Hive?

La rúbrica pide conectar Metabase a las fuentes (Postgres/Mongo) y al Data
Warehouse (Hive). Sin embargo:

- El ETL de Spark ([dags/scripts/spark_etl.py](../dags/scripts/spark_etl.py)) **solo
  llena 3 tablas agregadas** en Hive (`tendencias_consumo`, `horarios_pico`,
  `crecimiento_mensual`). Esas tablas **no contienen** ingresos por mes×categoría,
  ni datos geográficos, ni estados de pedido.
- Los 3 dashboards obligatorios necesitan justamente esas dimensiones, y **todas
  están en Postgres** (órdenes con estado, ubicaciones con coordenadas, platos con
  categoría y precio, fechas de creación).
- Metabase **no trae driver nativo de Hive** (requiere un plugin de terceros y
  levantar todo el perfil pesado `data`).

➡️ **Los dashboards se construyen sobre Postgres.** Conectar Hive es opcional y se
documenta al final (sección 7).

---

## 2. Levantar Metabase (mínimo de contenedores)

Metabase necesita Postgres **con datos**. Si vienes de probar el grafo (Track B),
ya tienes Postgres poblado y puedes saltar al paso 4.

```powershell
# 1) Postgres
docker compose up -d db

# 2) La API SOLO para crear el esquema de tablas (sin keycloak/redis/etc.)
docker compose up -d --build --no-deps api
docker compose logs --tail 20 api      # esperar "Conectado a PostgreSQL"

# 3) Poblar Postgres (usuarios, platos, 240 órdenes, 30 ubicaciones con coords)
./seed.ps1

# 4) Levantar Metabase
docker compose --profile viz up -d metabase
```

Contenedores vivos: **db, api, metabase** (3). La primera vez Metabase tarda
~1-2 min en inicializar su app-db; sigue su arranque con
`docker compose logs -f metabase` hasta ver *"Metabase Initialization COMPLETE"*.

Abre **http://localhost:3030**.

---

## 3. Configuración inicial (asistente, solo la 1ª vez)

1. Idioma → datos del admin (nombre, email, contraseña). *Es la cuenta local de
   Metabase; cualquier valor sirve para el demo.*
2. En "Agregar tus datos" elige **PostgreSQL** con estos valores
   (son los del `docker-compose`, red interna):

   | Campo | Valor |
   |---|---|
   | Display name | `Restaurante` |
   | Host | `db` |
   | Port | `5432` |
   | Database name | `restaurante_db` |
   | Username | `restaurante_admin` |
   | Password | *(el `DB_PASSWORD` de tu `.env`, ej. `123lol`)* |

   > Host es `db` (no `localhost`) porque Metabase habla con Postgres **dentro** de
   > la red Docker `app-network`.

3. Termina el asistente. Metabase escaneará el esquema (tarda unos segundos).

**Smoke test** (Menú **+ New → SQL query**, base `Restaurante`):
```sql
SELECT COUNT(*) AS ordenes FROM "order";
```
Debe devolver ~240. Si funciona, la conexión está lista.

---

## 4. Cómo se construye cada gráfico

Para cada consulta de abajo: **+ New → SQL query** → pega el SQL → **Run** →
elige el tipo de visualización (botón **Visualization**) → **Save** (ponle nombre
y dile a qué dashboard agregarla). Crea primero los 3 dashboards vacíos desde
**+ New → Dashboard**: `Ingresos`, `Actividad Geográfica`, `Estadísticas de Pedidos`.

> Nota sobre "ingresos": se consideran ingresos los pedidos **Completed (13)** y
> **Delivered (22)**; se excluyen Cancelled/Pending/Confirmed. Si quieres incluir
> todos, quita la línea `WHERE o.status_id IN (13, 22)`.

---

## 5. Dashboard 1 — Ingresos por mes y categoría

**5.1 Ingresos por mes** · viz: **Bar** o **Line** (eje X = `mes`, Y = `ingresos`)
```sql
SELECT
  date_trunc('month', o.created_at) AS mes,
  SUM(p.price * oi.quantity)        AS ingresos
FROM "order" o
JOIN order_item oi ON oi.order_id = o.id
JOIN plate p       ON p.id = oi.plate_id
WHERE o.status_id IN (13, 22)
GROUP BY 1
ORDER BY 1;
```

**5.2 Ingresos por mes y categoría** · viz: **Bar apilada** (X = `mes`, Y =
`ingresos`, *Series/Breakout* = `categoria`)
```sql
SELECT
  date_trunc('month', o.created_at) AS mes,
  c.name                            AS categoria,
  SUM(p.price * oi.quantity)        AS ingresos
FROM "order" o
JOIN order_item oi ON oi.order_id = o.id
JOIN plate p       ON p.id = oi.plate_id
JOIN category c    ON c.id = p.category_id
WHERE o.status_id IN (13, 22)
GROUP BY 1, 2
ORDER BY 1, 2;
```

**5.3 Participación de ingresos por categoría** · viz: **Pie**
```sql
SELECT
  c.name                     AS categoria,
  SUM(p.price * oi.quantity) AS ingresos
FROM "order" o
JOIN order_item oi ON oi.order_id = o.id
JOIN plate p       ON p.id = oi.plate_id
JOIN category c    ON c.id = p.category_id
WHERE o.status_id IN (13, 22)
GROUP BY 1
ORDER BY ingresos DESC;
```

---

## 6. Dashboard 2 — Actividad de clientes por zona geográfica

**6.1 Mapa de actividad** · viz: **Map → Pin map** (Latitude = `latitude`,
Longitude = `longitude`). *Aprovecha las coordenadas que agregamos en el Track B.*
```sql
SELECT
  l.name      AS zona,
  l.latitude  AS latitude,
  l.longitude AS longitude,
  COUNT(o.id) AS pedidos,
  COALESCE(SUM(p.price * oi.quantity), 0) AS ingresos
FROM "order" o
JOIN location l    ON l.id = o.location_id
LEFT JOIN order_item oi ON oi.order_id = o.id
LEFT JOIN plate p       ON p.id = oi.plate_id
GROUP BY l.name, l.latitude, l.longitude
ORDER BY pedidos DESC;
```

**6.2 Pedidos por zona** · viz: **Row chart** (barras horizontales)
```sql
SELECT l.name AS zona, COUNT(o.id) AS pedidos
FROM "order" o
JOIN location l ON l.id = o.location_id
GROUP BY l.name
ORDER BY pedidos DESC;
```

**6.3 Clientes únicos por zona** · viz: **Bar**
```sql
SELECT l.name AS zona, COUNT(DISTINCT o.user_id) AS clientes
FROM "order" o
JOIN location l ON l.id = o.location_id
GROUP BY l.name
ORDER BY clientes DESC;
```

---

## 7. Dashboard 3 — Estadísticas de pedidos (completados vs cancelados)

**7.1 Distribución por estado** · viz: **Pie**
```sql
SELECT s.name AS estado, COUNT(o.id) AS pedidos
FROM "order" o
JOIN status s ON s.id = o.status_id
GROUP BY s.name
ORDER BY pedidos DESC;
```

**7.2 Completados vs Cancelados por mes** · viz: **Line** (X = `mes`, Y =
`pedidos`, *Series* = `estado`)
```sql
SELECT
  date_trunc('month', o.created_at) AS mes,
  s.name                            AS estado,
  COUNT(o.id)                       AS pedidos
FROM "order" o
JOIN status s ON s.id = o.status_id
WHERE s.name IN ('Completed', 'Cancelled')
GROUP BY 1, 2
ORDER BY 1, 2;
```

**7.3 Tasa de cancelación** · viz: **Number** (escalar)
```sql
SELECT
  ROUND(100.0 * COUNT(*) FILTER (WHERE s.name = 'Cancelled') / COUNT(*), 1)
    AS tasa_cancelacion_pct
FROM "order" o
JOIN status s ON s.id = o.status_id;
```

---

## 8. Persistencia, exportación y entregables

- Los dashboards viven en la app-db H2 dentro del volumen `metabase_data`.
  **Sobreviven** a `docker compose stop/start` y a `docker compose down` (sin `-v`).
  Un **`docker compose down -v` los BORRA.**
- Para el entregable "dashboards exportables":
  - **Fuente de verdad reproducible:** este archivo (el SQL). Si el volumen se
    borra, recrear los dashboards toma pocos minutos copiando/pegando el SQL.
  - **Capturas/video:** una vez armados, toma screenshots de cada dashboard y/o
    graba la demo (parte de los entregables de la rúbrica).
  - Cada pregunta/gráfico puede descargarse como CSV desde su menú (•••).
- Recomendación para la demo: usa `docker compose stop metabase` / `start metabase`
  en lugar de `down -v` mientras prepares las capturas, para no perder el trabajo.

---

## 9. (Opcional) Conectar el Data Warehouse de Hive

Solo si quieres mostrar también la conexión al warehouse (no necesario para los 3
dashboards). Requiere:

1. Levantar el perfil analítico: `docker compose --profile data up -d` y correr el
   ETL de Spark para poblar Hive (ver [docs/paso4_orquestacion_airflow.md](paso4_orquestacion_airflow.md)).
2. Añadir a Metabase el **driver community de Starburst/Hive** (`.jar` en
   `/plugins`), ya que Metabase no lo trae de fábrica.
3. Conectar con host `hive-server`, puerto `10000`, base `restaurante_olap`.

> En PCs con poca RAM esto es pesado (Hadoop + Hive + Spark). Para la evaluación,
> los dashboards sobre Postgres ya cumplen el criterio de "Visualización".
