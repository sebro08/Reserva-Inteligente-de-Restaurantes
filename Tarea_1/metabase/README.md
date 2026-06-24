# Provisión automática de Metabase ("el botón")

`provision_metabase.py` recrea, vía la API REST de Metabase, **toda** la
visualización del Track C: la conexión al Data Warehouse + las 9 preguntas + los
3 dashboards. Pensado para el flujo en que se hace `docker compose down -v` (no se
conserva el volumen `metabase_data`): se corre una vez tras levantar y los
dashboards aparecen idénticos siempre. Es idempotente (se puede re-ejecutar).

## Conexión al warehouse

Usa el driver **SparkSQL** que viene **integrado** en Metabase (no requiere ningún
`.jar` ni montar `/plugins`). Conecta a `hive-server:10000`, base `restaurante_olap`.

## Requisitos previos

1. Postgres con datos + ETL ya corrido (las tablas `restaurante_olap.*` existen en Hive).
2. Servicios arriba: `db`, perfil `data` (al menos `hive-server`) y perfil `viz` (`metabase`).

```powershell
docker compose up -d db
docker compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
docker compose --profile spark-job run --rm spark-submit      # ETL
docker compose --profile viz up -d metabase
```

## Ejecutar

```powershell
pip install requests        # única dependencia (una sola vez)
python metabase/provision_metabase.py
```

Al terminar imprime las URLs de los 3 dashboards y las credenciales admin.

## Configuración (variables de entorno, opcionales)

| Variable | Default | Para qué |
|---|---|---|
| `MB_URL` | `http://localhost:3030` | URL de Metabase |
| `MB_ADMIN_EMAIL` / `MB_ADMIN_PASSWORD` | `admin@resto.com` / `Restaurante.2026` | cuenta admin local |
| `MB_DB_ENGINE` | `sparksql` | motor del DW (fallback: `postgres`) |
| `MB_DB_HOST` / `MB_DB_PORT` | `hive-server` / `10000` | host/puerto del DW |
| `MB_DB_DBNAME` | `restaurante_olap` | base/esquema de los cubos |

## Fallback

Si en alguna máquina el driver SparkSQL no logra el handshake con HiveServer2, el
script lo detecta en `validar_conexion()` y avisa. Alternativa: apuntar a un mart
en Postgres exportando `MB_DB_ENGINE=postgres` y los `MB_DB_*` correspondientes.
