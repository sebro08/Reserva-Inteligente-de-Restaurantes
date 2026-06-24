# Reserva Inteligente de Restaurantes

Plataforma distribuida para la gestión de restaurantes, reservas y pedidos. El
sistema arrancó como una **API transaccional (OLTP)** y evolucionó a una segunda
fase con capacidades **analíticas (OLAP)**: pipeline de datos, Data Warehouse,
análisis de grafos y dashboards.

Esta guía es el punto de partida para levantar y trabajar el proyecto. La
documentación técnica a fondo (decisiones de diseño, diagramas) está en la
carpeta [`docs/`](./docs) y en el documento de entrega.

## Autores
- Sebastián Rodríguez Sánchez
- Gabriel Arguedas Solano

---

## Tecnologías

**Capa transaccional (OLTP)**
- **Backend:** Node.js, Express, TypeScript, TypeORM
- **Bases de datos:** PostgreSQL (relacional) y MongoDB *sharded* (documental)
- **Auth:** Keycloak (OAuth2 / JWT) · **Caché:** Redis · **Búsqueda:** Elasticsearch
- **Infra:** Docker, Docker Compose, Nginx (balanceador)
- **Docs API:** OpenAPI (Swagger) + portal Docusaurus/Redoc

**Capa analítica (OLAP) — Proyecto 2**
- **Orquestación:** Apache Airflow
- **Procesamiento:** Apache Spark (PySpark)
- **Data Warehouse:** Apache Hive sobre Hadoop HDFS (formato Parquet)
- **Grafos y rutas:** Neo4j (+ APOC)
- **Visualización:** Metabase

> El sistema es **neutral a la fuente**: todo el pipeline analítico funciona igual
> con `DB_TYPE=postgres` o `DB_TYPE=mongo`.

---

## Requisitos previos
- **Docker** y **Docker Compose**
- **Node.js 18+** (solo para correr `graph-loader`, las pruebas o el portal de docs en local)
- **Python 3** con `pip` (solo para la provisión de Metabase)
- Recomendado para la capa analítica: subir el límite de RAM de Docker en
  `.wslconfig` (10 GB o más), ya que Hadoop/Hive/Spark son pesados.

---

## 1. Configuración del entorno

Copiá el archivo de ejemplo y ajustá las variables:

```bash
cp .env.example .env
```

La variable más importante es **`DB_TYPE`** (`postgres` o `mongo`), que decide el
motor que usa toda la plataforma (API, ETL y graph-loader). Las credenciales de
ejemplo (`changeme`, `password123`, etc.) son para entorno local; cambialas si lo
necesitás.

---

## 2. Levantar la capa transaccional

### Opción A — PostgreSQL (más liviano)

```bash
# DB_TYPE=postgres en el .env
docker-compose up -d --build      # api, nginx, db, keycloak, redis, neo4j, search...
./seed.ps1                        # sembrado de datos (Windows / PowerShell)
```

PostgreSQL inicia vacío; `seed.ps1` inserta catálogos, datos geográficos y los
datos transaccionales (≈240 órdenes).

### Opción B — MongoDB (clúster con sharding)

```bash
# DB_TYPE=mongo en el .env
docker-compose --profile mongo up -d --build
```

No hace falta `seed.ps1`: el contenedor `mongoinit` habilita el sharding y
siembra los datos automáticamente. Podés seguir el progreso con
`docker logs -f mongoinit`.

---

## 3. Levantar la capa analítica (Proyecto 2)

Construí primero las imágenes propias (una sola vez):

```bash
docker-compose --profile data build airflow-webserver   # -> restaurante_airflow:latest
docker-compose build spark-submit                        # -> restaurante_spark:latest
```

### Pipeline ETL (Airflow + Spark + Hive)

```bash
docker-compose --profile data up -d      # Hadoop, Hive y Airflow
```

1. Entrá a **Airflow** en `http://localhost:8081` (admin/admin).
2. Activá y dispará (*Trigger*) el DAG **`restaurante_pipeline_etl`**.
3. Spark detecta `DB_TYPE`, extrae de Postgres/Mongo, transforma en memoria y
   carga el esquema estrella (`restaurante_dw`) y los cubos OLAP
   (`restaurante_olap`) en Hive.

> ¿Solo querés correr el ETL sin Airflow? `docker-compose --profile spark-job run --rm spark-submit`

### Grafos y rutas (Neo4j)

El `graph-loader` corre **en el host** (no dentro de Docker), por eso usa el
puerto de Postgres mapeado al host (`5433`):

```bash
cd graph-loader
npm install
npm run dev        # lee .env.local (DB_HOST=localhost, DB_PORT=5433)
```

Esto carga nodos, relaciones base, distancias (Haversine + k vecinos), co-compras
y repartidores simulados en Neo4j. El análisis se consulta vía los endpoints
`/graph/*` de la API. Neo4j Browser: `http://localhost:7474` (neo4j / password123).

### Dashboards (Metabase)

```bash
docker-compose --profile viz up -d metabase
pip install requests
python metabase/provision_metabase.py    # crea conexión, preguntas y los 3 dashboards
```

Metabase: `http://localhost:3030`. Ver detalle en [`metabase/README.md`](./metabase/README.md).

---

## Accesos rápidos

| Servicio | URL | Notas |
| :--- | :--- | :--- |
| API (vía Nginx) | `http://localhost/api/...` | Nginx reescribe `/api/` → `/` |
| **Swagger UI** | `http://localhost/api/api-docs` | **No** es `:3000` (puerto interno) |
| Portal de docs | `http://localhost:3000/` | Solo al correr `docs-portal` en local |
| Keycloak | `http://localhost:8080` | Identity Provider |
| Airflow | `http://localhost:8081` | admin / admin |
| Neo4j Browser | `http://localhost:7474` | neo4j / password123 (Bolt en `:7687`) |
| Metabase | `http://localhost:3030` | dashboards OLAP |

---

## Documentación de la API (OpenAPI / Swagger)

La API se autodocumenta con **OpenAPI 3.0** (`swagger-jsdoc` + `swagger-ui-express`).
La doc vive junto al código: cada endpoint lleva un comentario `@swagger` en
`backend/src/routes/*.ts` y `backend/src/graph/*.routes.ts`. Con el sistema
arriba, la interfaz interactiva está en **`http://localhost/api/api-docs`**.

Además existe un portal navegable (Docusaurus + Redoc) que renderiza el mismo
spec. Para regenerarlo y levantarlo:

```bash
cd backend && npm run export:openapi    # vuelca el spec a docs-portal/static/openapi.json
cd ../docs-portal && npm install && npm start
```

Detalle en [`docs-portal/README.md`](./docs-portal/README.md).

---

## Pruebas

Las pruebas automatizadas (Jest + Supertest) corren desde `backend/`:

```bash
cd backend
npm run test               # unitarias (con mocks)
npm run test:integration   # integración (SQLite en memoria, DB_TYPE=postgres)
npm run test:all           # ambas
```

Para una validación manual de extremo a extremo de todo el sistema (transaccional
+ analítico), seguí la guía completa en
[`docs/guia_pruebas_completa.md`](./docs/guia_pruebas_completa.md).

---

## Estructura del repositorio

```
Tarea_1/
├── backend/            # API REST transaccional (Express + TypeORM)
│   └── src/
│       ├── routes/     #   Endpoints + anotaciones @swagger
│       ├── controller/ · model/ · repository/ · middleware/ · database/
│       ├── graph/      #   Exposición del grafo: endpoints /graph/*
│       └── swagger/    #   Config OpenAPI + export a openapi.json
├── graph-loader/       # ETL hacia Neo4j (corre en el host)
├── dags/               # Airflow: DAG + scripts/spark_etl.py (PySpark)
├── hive_scripts/       # DDL del esquema estrella (init_schema.hql)
├── metabase/           # provision_metabase.py (dashboards idempotentes)
├── search-service/     # Microservicio de búsqueda (reindex Elasticsearch)
├── nginx/ · keycloak/  # Reverse proxy e Identity Provider
├── docs-portal/        # Portal Docusaurus + Redoc
├── docs/               # Documentación técnica y guías de prueba
├── docker-compose.yml  # Orquesta todo (perfiles: data, mongo, viz, spark-job)
└── seed.ps1            # Sembrado de datos (Windows)
```

> El módulo de grafos vive en **dos** lugares a propósito: `graph-loader/`
> (cargar datos al grafo) y `backend/src/graph/` (consultar el grafo vía REST).

---

## Limpieza del entorno

```bash
docker-compose --profile data --profile mongo --profile viz down -v
```

> `down -v` borra los volúmenes, incluyendo los datos de Metabase: tras esto hay
> que volver a correr `provision_metabase.py`.
