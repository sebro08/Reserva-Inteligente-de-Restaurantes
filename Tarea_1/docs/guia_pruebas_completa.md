# Guía de pruebas — Proyecto 2 (paso a paso, copiar/pegar)

Prueba **todas** las funcionalidades de la rúbrica: DW/OLAP, Spark, Metabase,
Airflow, Neo4j y rutas de entrega. Incluye las **dos fuentes**: **Postgres**
(máquina modesta) y **Mongo** (máquina potente).

**Reglas para no perderse:**
- Todos los comandos son **PowerShell** y se corren **dentro de `Tarea_1/`**:
  ```powershell
  cd C:\Users\50662\Documents\GitHub\Reserva-Inteligente-de-Restaurantes\Tarea_1
  ```
- Se usan **profiles** de Docker para no levantar todo a la vez: `default` (db, api,
  neo4j, nginx…), `data` (Hadoop/Hive/Airflow), `viz` (Metabase), `mongo` (cluster
  Mongo), `spark-job` (Spark efímero).
- Puertos: Metabase **3030**, Airflow **8081**, Neo4j **7474**, Hive **10000**,
  API (vía nginx) **80**, Postgres host **5433**.

---

# FASE 0 — Preparación (una sola vez)

**0.1 (Solo máquina modesta) Limitar recursos de Docker.** Crear/editar
`C:\Users\<tu_usuario>\.wslconfig`:
```ini
[wsl2]
memory=10GB
processors=6
swap=4GB
```
Aplicar (cerrar Docker Desktop antes):
```powershell
wsl --shutdown
```
Reabrir Docker Desktop.

**0.2 Elegir la fuente en `.env`.** Para el camino Postgres:
```
DB_TYPE=postgres
```
(El compañero usará `DB_TYPE=mongo`, ver Parte B.)

**0.3 Construir las imágenes propias (Spark y Airflow):**
```powershell
docker compose build spark-submit
docker compose --profile data build airflow-webserver
docker images | findstr restaurante
```
Debes ver `restaurante_spark` y `restaurante_airflow`.

> **Reset limpio** (borra TODO, incluidos volúmenes y dashboards). Úsalo antes de
> grabar o si algo quedó sucio:
> ```powershell
> docker compose --profile data --profile viz --profile mongo down -v
> ```

---

# PARTE A — Fuente PostgreSQL (máquina modesta)

## FASE 1 — Base transaccional + datos de prueba

Levanta: **db + api**.
```powershell
docker compose up -d db
docker compose up -d --build --no-deps api
docker compose logs --tail 20 api
```
Espera a ver **"Conectado a PostgreSQL"** (la API crea el esquema). Luego pobla:
```powershell
.\seed.ps1
```
**Verificar** (debe dar ≈240):
```powershell
docker exec -it restaurante_db psql -U restaurante_admin -d restaurante_db -c "SELECT COUNT(*) AS ordenes FROM \"order\";"
```

## FASE 2 — Data Warehouse + OLAP con Spark (→ Hive)

Levanta: **Hive/Hadoop** y corre el **ETL** una vez.
```powershell
docker compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
docker compose --profile spark-job run --rm spark-submit
```
El log debe terminar con `5 dimensiones + 1 hechos` y `8 cubos OLAP`.

**Verificar el esquema estrella, los cubos y la integridad:**
```powershell
docker exec -it hive-server /opt/hive/bin/beeline -u jdbc:hive2://localhost:10000 -e "SHOW TABLES IN restaurante_dw; SHOW TABLES IN restaurante_olap;"
docker exec -it hive-server /opt/hive/bin/beeline -u jdbc:hive2://localhost:10000 -e "SELECT COUNT(*) FROM restaurante_dw.fact_detalle_ordenes;"
docker exec -it hive-server /opt/hive/bin/beeline -u jdbc:hive2://localhost:10000 -e "SELECT * FROM restaurante_olap.olap_ingresos_mes_categoria;"
docker exec -it hive-server /opt/hive/bin/beeline -u jdbc:hive2://localhost:10000 -e "SELECT * FROM restaurante_olap.tendencias_consumo;"
```
`restaurante_dw` = 5 dimensiones + `fact_detalle_ordenes`. `restaurante_olap` = 8 cubos
(`tendencias_consumo`, `horarios_pico`, `crecimiento_mensual`,
`olap_ingresos_mes_categoria`, `olap_ingresos_categoria`,
`olap_actividad_geografica`, `olap_pedidos_estado`, `olap_pedidos_mes_estado`).

## FASE 3 — Orquestación con Apache Airflow

> Prerrequisito: db poblado (Fase 1) y Hive arriba (Fase 2).

Levanta: **Airflow**.
```powershell
docker compose --profile data up -d postgres-airflow airflow-init airflow-webserver airflow-scheduler
docker logs -f airflow-scheduler
```
Espera **"Scheduler started"** y sal con `Ctrl+C`. Abre **http://localhost:8081**
(usuario `admin`, contraseña `admin`).

En la UI:
1. Activa el DAG **`restaurante_pipeline_etl`** con el interruptor.
2. Ábrelo → pestaña **Graph** → botón ▶ **Trigger DAG**.
3. Verifica las **4 tareas en verde** (la T2/Spark es la más larga):
   `verificar_fuentes_datos` → `ejecutar_spark_etl` → `verificar_tablas_hive` → `reindexar_elasticsearch`.

> **RAM justa:** antes de la Fase 4 puedes apagar Airflow para liberar memoria:
> ```powershell
> docker compose --profile data stop airflow-webserver airflow-scheduler
> ```

## FASE 4 — Visualización con Metabase (3 dashboards desde el DW)

> Prerrequisito: Hive arriba con los cubos ya cargados (Fase 2 o 3).

Levanta: **Metabase**.
```powershell
docker compose --profile viz up -d metabase
docker compose logs -f metabase
```
Espera **"Metabase Initialization COMPLETE"** y sal con `Ctrl+C`. Provisiona los
3 dashboards automáticamente:
```powershell
pip install requests
python metabase/provision_metabase.py
```
El script imprime 3 URLs y las credenciales admin (`admin@resto.com` /
`Restaurante.2026`). Abre **http://localhost:3030** y muestra:
1. **Ingresos por mes y categoría** (barras apiladas + pie + total mensual)
2. **Actividad de clientes por zona geográfica** (mapa de pines + barras)
3. **Estadísticas de pedidos** (completados vs cancelados + tasa de cancelación)

**Exportar reportes:** en cualquier gráfico → menú `•••` → *Download results* (CSV).

## FASE 5 — Neo4j: grafo, consultas y rutas de entrega

Levanta: **neo4j** y carga el grafo desde la fuente activa (`DB_TYPE`).
```powershell
docker compose up -d neo4j
cd graph-loader
npm install
npm run dev
cd ..
```
El log termina en **"Graph load completed"** (carga nodos, relaciones, distancias
Haversine, recomendaciones y 3 repartidores).

Abre **http://localhost:7474** (usuario `neo4j`, contraseña `password123`). Pega
cada consulta en el editor Cypher:

**Ver el grafo:**
```cypher
MATCH (n) RETURN n LIMIT 50;
```
**5 productos más comprados juntos (co-compra):**
```cypher
MATCH (p1:Plate)<-[:CONTAINS]-(o:Order)-[:CONTAINS]->(p2:Plate)
WHERE p1.id < p2.id
RETURN p1.name AS producto1, p2.name AS producto2, count(*) AS veces
ORDER BY veces DESC LIMIT 5;
```
**Usuarios que recomiendan a otros:**
```cypher
MATCH (u1:User)-[r:RECOMMENDS]->(u2:User)
RETURN u1.firstName AS usuario, u2.firstName AS recomendado, r.weight AS peso
ORDER BY peso DESC LIMIT 20;
```
**Camino mínimo entre ubicaciones (Dijkstra ponderado por km, APOC):**
```cypher
MATCH (a:Location {id: 1}), (b:Location {id: 18})
CALL apoc.algo.dijkstra(a, b, 'DISTANCE', 'km') YIELD path, weight
RETURN [n IN nodes(path) | n.name] AS ruta, weight AS total_km;
```

### Rutas de entrega vía la API (enrutamiento)

Levanta el stack mínimo de la API (db ya está arriba):
```powershell
docker compose up -d keycloak redis
docker compose up -d --build api nginx
```
Prueba los 4 endpoints de análisis (no requieren token; salen vía nginx en `/api`):
```powershell
curl http://localhost/api/graph/top-products
curl http://localhost/api/graph/recommending-users
curl "http://localhost/api/graph/shortest-path?from=1&to=18"
curl "http://localhost/api/graph/delivery-routes?restaurantId=1"
```
`delivery-routes` devuelve la asignación por repartidor con vecino más cercano
(km y minutos por tramo).

---

# PARTE B — Fuente MongoDB (máquina del compañero)

Demuestra que **el mismo pipeline y el mismo grafo** funcionan con Mongo. Solo
cambia la fuente; el warehouse y los cubos quedan **idénticos** a Postgres.

## B0 — Cambiar la fuente
En `.env`:
```
DB_TYPE=mongo
```
(Asegúrate de tener construidas las imágenes — Fase 0.3.)

## B1 — Levantar el cluster Mongo (se puebla solo)
Levanta: **cluster Mongo** (~14 contenedores; el seed corre vía `init.sh` → `seed.js`).
```powershell
docker compose --profile mongo up -d
```
Verifica los datos (≈240 órdenes):
```powershell
docker exec -it mongos1 mongosh restaurant_db --eval "db.orders.countDocuments()"
```

## B2 — DW + OLAP con Spark desde Mongo
Levanta Hive y corre el ETL (ya leerá de Mongo por `DB_TYPE=mongo`):
```powershell
docker compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
docker compose --profile spark-job run --rm spark-submit
```
**Validación dual-source:** mismas tablas y conteos que con Postgres.
```powershell
docker exec -it hive-server /opt/hive/bin/beeline -u jdbc:hive2://localhost:10000 -e "SELECT COUNT(*) FROM restaurante_dw.fact_detalle_ordenes;"
docker exec -it hive-server /opt/hive/bin/beeline -u jdbc:hive2://localhost:10000 -e "SELECT * FROM restaurante_olap.olap_ingresos_mes_categoria;"
```

## B3 — Airflow con fuente Mongo
```powershell
docker compose --profile data up -d postgres-airflow airflow-init airflow-webserver airflow-scheduler
docker compose --profile data up -d --force-recreate airflow-scheduler
```
(El `--force-recreate` hace que el scheduler tome `DB_TYPE=mongo`.) Luego dispara el
DAG `restaurante_pipeline_etl` igual que en la Fase 3.

## B4 — Metabase con datos de Mongo
Idéntico a la Fase 4 (los dashboards leen del DW, que ahora se alimentó de Mongo):
```powershell
docker compose --profile viz up -d metabase
python metabase/provision_metabase.py
```

## B5 — Neo4j con datos de Mongo
Idéntico a la Fase 5; el cargador detecta `DB_TYPE=mongo`:
```powershell
docker compose up -d neo4j
cd graph-loader
npm install
npm run dev
cd ..
```

---

# Apéndice

## Apagar sin perder dashboards
```powershell
docker compose stop                 # apaga todo, conserva volúmenes
docker compose --profile data --profile viz stop
```
Reanudar: `docker compose start` (o `up -d` del servicio que necesites).

## Solución rápida de problemas
| Síntoma | Solución |
|---|---|
| `Image restaurante_spark:latest not found` | `docker compose build spark-submit` (Fase 0.3). |
| Tablas de Hive vacías | No se corrió `.\seed.ps1`, o el ETL corrió antes de poblar. |
| Tarea 2 (Spark) falla por Hive | Hive aún arrancando; espera 3–5 min y vuelve a disparar el DAG. |
| El scheduler se reinicia | `docker compose --profile data build --no-cache airflow-webserver`. |
| Mapa de Metabase sin pines | Faltan coordenadas: `Get-Content backend\seed\06_location_coords.sql -Encoding UTF8 \| docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db`. |
| La máquina se congela | Verifica `.wslconfig` (Fase 0.1) y apaga Airflow antes de Metabase. |
| Dashboards en blanco tras `down -v` | Es normal: re-corre `python metabase/provision_metabase.py`. |

## Checklist contra la rúbrica
| Criterio (peso) | Se prueba en |
|---|---|
| Data Warehouse y OLAP (20%) | Fase 2 (esquema estrella + 8 cubos en Hive) |
| Procesamiento con Spark (20%) | Fase 2 (DataFrames + SparkSQL; tendencias/horarios pico/crecimiento) |
| Visualización (15%) | Fase 4 (3 dashboards Metabase) |
| Airflow (15%) | Fase 3 (DAG `restaurante_pipeline_etl` en verde) |
| Neo4J (15%) | Fase 5 (grafo + 4 consultas) |
| Enrutamiento (10%) | Fase 5 (`shortest-path`, `delivery-routes`) |
| Pruebas/validación | Fase 2 (integridad), Fase 3 (pipeline), Parte B (dual-source) |
| Documentación (5%) | PDF + Swagger/portal |
</content>
</invoke>
