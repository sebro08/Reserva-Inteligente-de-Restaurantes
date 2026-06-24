# Guion de demostración (video) — Proyecto 2

Paso a paso con **comandos exactos** para demostrar todo el sistema. Está dividido
en **Parte A (pipeline de datos — Gabriel)** y **Parte B (grafos, rutas y validación
Mongo — compañero)**. Al final hay un **checklist contra la rúbrica** para no dejar
nada fuera.

> **Comandos en PowerShell (Windows).** El sistema usa *profiles* de Docker Compose
> para no levantar todo a la vez: `default` (solo `db` nos interesa aquí), `data`
> (Hadoop/Hive/Airflow), `viz` (Metabase), `mongo` (cluster Mongo), `spark-job`
> (contenedor Spark efímero).

---

## 0. Antes de grabar: reset limpio

El botón 🗑️ de Docker Desktop borra contenedores pero **NO los volúmenes** (por eso
puede sobrevivir la cuenta de Metabase o datos viejos). Para partir 100% de cero:

```powershell
docker compose --profile data --profile viz --profile mongo down -v
```

Confirmá que el `.env` tenga la fuente que vas a demostrar:
```
DB_TYPE=postgres
```

> **Tip de grabación (PC modesta):** se levanta por segmentos, no todo junto. Cada
> segmento de abajo dice qué contenedores enciende. Si te quedás sin RAM antes de
> Metabase, podés `docker compose --profile data stop airflow-webserver airflow-scheduler`.

---

# PARTE A — Pipeline de datos (Gabriel) · fuente Postgres

## A1. Base transaccional + datos de ejemplo

```powershell
docker compose up -d db
docker compose up -d --build --no-deps api        # crea el esquema (TypeORM synchronize)
docker compose logs --tail 20 api                  # esperar "Conectado a PostgreSQL"
.\seed.ps1                                          # usuarios, platos, 240 ordenes, 30 ubicaciones
```

**Mostrar:** que hay datos.
```powershell
docker exec -it restaurante_db psql -U restaurante_admin -d restaurante_db -c "SELECT COUNT(*) AS ordenes FROM \"order\";"
```
→ ~240.

## A2. Data Warehouse + OLAP con Apache Spark (→ Hive)

```powershell
docker compose build spark-submit                  # hornea spark_etl.py en la imagen
docker compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
docker compose --profile spark-job run --rm spark-submit
```

El log debe terminar con `5 dimensiones + 1 hechos` y `8 cubos OLAP`.

**Mostrar (esquema estrella + cubos + integridad de datos):**
```powershell
docker exec -it hive-server beeline -u jdbc:hive2://localhost:10000 -e "SHOW TABLES IN restaurante_dw; SHOW TABLES IN restaurante_olap;"
docker exec -it hive-server beeline -u jdbc:hive2://localhost:10000 -e "SELECT COUNT(*) FROM restaurante_dw.fact_detalle_ordenes;"
docker exec -it hive-server beeline -u jdbc:hive2://localhost:10000 -e "SELECT * FROM restaurante_olap.olap_ingresos_mes_categoria;"
```
**Narrar:** "el ETL lee Postgres (o Mongo) con Spark, arma el **esquema estrella** y
**8 cubos OLAP** pre-agregados. Los 3 análisis nombrados (tendencias, horarios pico,
crecimiento mensual) usan **SparkSQL**; el esquema estrella usa **DataFrames**."
La integridad se ve en que `fact_detalle_ordenes` tiene tantas filas como líneas de pedido.

## A3. Orquestación con Apache Airflow (el DAG)

> **Prerrequisito:** `db` **poblado** (A1) y **Hive arriba** (A2) ANTES de disparar el
> DAG. T1 verifica Postgres, y T2 corre Spark contra Postgres→Hive; si no están, falla.
> Las credenciales de la BD las toma Airflow del `.env` (no van hardcodeadas en el DAG).

```powershell
docker compose --profile data up -d postgres-airflow airflow-init airflow-webserver airflow-scheduler
```
Abrir **http://localhost:8081** (usuario `admin` / `admin`).

**Mostrar:** activar y disparar el DAG **`restaurante_pipeline_etl`** ("Trigger DAG").
Ver las 4 tareas en verde:
- `verificar_fuentes_datos` (T1) → comprueba Postgres + HiveServer2
- `ejecutar_spark_etl` (T2) → lanza el contenedor Spark (mismo ETL, orquestado)
- `verificar_tablas_hive` (T3) → confirma las tablas en HDFS
- `reindexar_elasticsearch` (T4) → reindexa el catálogo

**Narrar:** "el pipeline está programado (`schedule_interval` diario) y es modular;
aquí lo disparo manualmente para el demo. T2 corre el mismo ETL pero orquestado."

## A4. Visualización con Metabase (3 dashboards desde el DW)

```powershell
docker compose --profile viz up -d metabase
docker compose logs -f metabase                    # esperar "Initialization COMPLETE", luego Ctrl+C
pip install requests                               # una sola vez
python metabase/provision_metabase.py
```
El script imprime las 3 URLs. **Mostrar cada dashboard** (datos vienen de Hive vía el
driver SparkSQL integrado):
1. **Ingresos por mes y categoría** (barras apiladas + pie + total mensual)
2. **Actividad de clientes por zona geográfica** (mapa de pines + barras)
3. **Estadísticas de pedidos** (completados vs cancelados + tasa de cancelación)

**Reportes exportables:** en cualquier gráfico, menú `•••` → *Download results* (CSV).

> Si NO hiciste `down -v`, los dashboards siguen guardados y podés saltarte el script.

---

# PARTE B — Grafos, rutas y validación Mongo (compañero)

> Comandos base; el compañero ya tiene verificado este track y ajusta host/puerto a
> su setup (la API se accede por su puerto/nginx habitual; las rutas van bajo `/graph`).

## B1. Neo4j + carga del grafo

```powershell
docker compose up -d neo4j                          # neo4j 5.26, browser en http://localhost:7474
# Cargar el grafo desde la fuente activa (lee DB_TYPE):
cd graph-loader
npm install        # si es la 1a vez
npm run dev        # extrae de Postgres/Mongo y carga nodos/relaciones + distancias/recomendaciones/repartidores
cd ..
```
Abrir **http://localhost:7474** (usuario `neo4j` / `password123`) y mostrar el grafo
(`MATCH (n) RETURN n LIMIT 50`).

## B2. Consultas Cypher / endpoints de análisis

Mostrar en el **Neo4j Browser** (Cypher) y/o por la **API** (`/graph/...`):
- **5 productos más comprados juntos** → `GET /graph/top-products`
- **Usuarios que recomiendan a otros** → `GET /graph/recommending-users`
- **Caminos mínimos entre ubicaciones** (Dijkstra/APOC ponderado por km) → `GET /graph/shortest-path`
- **Asignación de rutas de entrega** (vecino más cercano / Neo4j) → `GET /graph/delivery-routes`

**Narrar:** modelo de grafo (Usuario, Producto, Orden, Ubicación) con relaciones
`[:PLACED]`, `[:CONTAINS]`, `[:RECOMMENDS]`, `[:CONNECTS]` (distancia), y la optimización
de rutas con caminos mínimos.

## B3. Validación dual-source (Mongo) — ⚠️ solo el compañero

Demuestra que el **mismo ETL** funciona con Mongo (no solo Postgres):

```powershell
# .env -> DB_TYPE=mongo
docker compose --profile mongo up -d                # cluster Mongo (~15 contenedores)
# poblar Mongo con infra-mongo/seed.js (mismo dataset que Postgres)
docker compose build spark-submit
docker compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
docker compose --profile spark-job run --rm spark-submit
```
**Mostrar:** que en Hive quedan las **mismas** tablas y conteos que con Postgres:
```powershell
docker exec -it hive-server beeline -u jdbc:hive2://localhost:10000 -e "SELECT COUNT(*) FROM restaurante_dw.fact_detalle_ordenes;"
```
**Narrar:** "el sistema es dual-source: el usuario elige Postgres o Mongo con `DB_TYPE`
y el warehouse queda idéntico, porque el ETL normaliza ambas fuentes." (Opcional: correr
el provision de Metabase y mostrar los dashboards idénticos servidos desde el DW alimentado por Mongo.)

---

## Checklist contra la rúbrica

| Criterio (peso) | Se demuestra en | Quién |
|---|---|---|
| Data Warehouse y OLAP (20%) | A2 (esquema estrella + 8 cubos en Hive) | Gabriel |
| Procesamiento con Spark (20%) | A2 (DataFrames + SparkSQL; 3 análisis) | Gabriel |
| Visualización (15%) | A4 (3 dashboards Metabase) | Gabriel |
| Airflow (15%) | A3 (DAG `restaurante_pipeline_etl` en verde) | Gabriel |
| Neo4J (15%) | B1–B2 (grafo + 4 consultas) | Compañero |
| Enrutamiento (10%) | B2 (`/graph/shortest-path`, `/graph/delivery-routes`) | Compañero |
| Pruebas/validación | A2 (integridad warehouse), A3 (pipeline), B3 (dual-source) | Ambos |
| Documentación (5%) | PDF + Swagger/portal | Ambos |
