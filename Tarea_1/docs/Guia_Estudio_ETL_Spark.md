# Guía de Estudio y Documentación Técnica: ETL con Apache Spark

Este documento sirve como guía de estudio y base para la documentación final del proyecto. Explica a detalle la implementación de la capa de procesamiento de datos (Paso 3) utilizando **Apache Spark**, las decisiones arquitectónicas tomadas y los pasos exactos para ejecutar el flujo.

> **📌 Nota de versión**: Este documento describe el estado del **Paso 3**. Varias
> piezas evolucionaron en el **Paso 4** (orquestación con Airflow). A lo largo del
> texto encontrarás bloques marcados con **🔄 Actualización (Paso 4)** que explican
> qué cambió y cómo funciona ahora. La guía de ejecución vigente está en
> `docs/paso4_orquestacion_airflow.md`.

---

## 1. Arquitectura y Decisiones de Diseño

Para cumplir con los requerimientos del proyecto sin sobrecargar el entorno local (limitación de memoria RAM), se tomaron las siguientes decisiones de diseño:

1. **Contenedor Temporal (Efemero) de Spark**:
   - **Decisión**: En lugar de desplegar un clúster completo de Spark (Master y Workers) que consuma RAM permanentemente, se configuró un contenedor temporal (`spark-submit`) en el `docker-compose.yml`.
   - **Por qué**: Esto permite que el motor de procesamiento solo consuma recursos durante los segundos o minutos que dura el cálculo. Al finalizar, el contenedor se destruye automáticamente gracias a la bandera `--rm`.
   - > **🔄 Actualización (Paso 4)**: La naturaleza efímera se mantiene, pero ahora el contenedor se lanza de dos formas: manualmente (`docker-compose --profile spark-job run --rm spark-submit`) **o** automáticamente desde Airflow mediante el `DockerOperator`, que lo crea, espera a que termine y lo elimina (`auto_remove=True`). Además, se le agregaron límites de recursos (`--master local[2]`, `--driver-memory 2g`) para no saturar máquinas modestas.
2. **Uso de la Imagen Oficial de Apache**:
   - **Decisión**: Se utilizó `apache/spark:3.4.1` en lugar de imágenes de terceros (como Bitnami).
   - **Por qué**: VMware/Bitnami retiró sus etiquetas públicas de Docker Hub. La imagen oficial de Apache garantiza disponibilidad a largo plazo y compatibilidad nativa con PySpark.
   - > **🔄 Actualización (Paso 4)**: `apache/spark:3.4.1` ya no se usa directamente, sino como **imagen base** de una imagen propia (`restaurante_spark:latest`) construida desde `Dockerfile.spark`. Esa imagen copia el script `spark_etl.py` dentro de sí misma, de modo que el contenedor es autocontenido y Airflow puede lanzarlo sin depender de rutas del host (clave en Windows). Consecuencia práctica: al modificar el script hay que reconstruir con `docker-compose build spark-submit`.
3. **Manejo de Permisos (Ivy Cache)**:
   - **Decisión**: Se agregó `--conf spark.jars.ivy=/tmp/.ivy2` al comando de ejecución de Spark.
   - **Por qué**: Spark necesita descargar los drivers (conectores JDBC de Postgres y Mongo) en tiempo de ejecución. Por defecto intenta guardarlos en el directorio `/home/spark/.ivy2/`, el cual suele dar errores de permisos (`FileNotFoundException`). Redirigir el caché a `/tmp` resuelve este problema de manera limpia en cualquier sistema operativo.
4. **.dockerignore**:
   - **Decisión**: Se creó un archivo `.dockerignore` en la raíz del proyecto.
   - **Por qué**: Al construir imágenes (como la API), Docker intentaba copiar los logs de Airflow que contienen enlaces simbólicos, rompiendo la compilación. Ignorar estas carpetas agiliza el proceso y evita errores críticos.
   - > **🔄 Actualización (Paso 4)**: Como ahora `Dockerfile.spark` necesita copiar `dags/scripts/spark_etl.py` (y la carpeta `dags/` estaba ignorada por completo), se añadió una **excepción**: `!dags/scripts/spark_etl.py`. Así se sigue ignorando todo `dags/` excepto ese archivo específico que sí debe entrar a la imagen de Spark.

---

## 2. Explicación del Pipeline de Datos (`spark_etl.py`)

El script principal se encuentra en `dags/scripts/spark_etl.py` y sigue la arquitectura clásica **ETL** (Extracción, Transformación y Carga):

### A. Extracción (Extract)
El script es dinámico y lee las credenciales directamente de las variables de entorno (`.env`).
- Spark utiliza conectores especializados para conectarse directamente a la base de datos transaccional (PostgreSQL) usando JDBC.
- Lee las tablas `user`, `order`, `order_item` y `plate` (menú), subiéndolas a la memoria de Spark como *DataFrames*.
- **Flexibilidad**: Se incluyó la función `get_mongo_df()` que permite leer desde colecciones de MongoDB si la arquitectura lo requiere más adelante.

> **🔄 Actualización (Paso 4)**: La lectura desde MongoDB **ya no es solo "para más
> adelante": está implementada y funcional**. El script ahora detecta la variable
> `DB_TYPE` y elige automáticamente entre dos extractores:
> - `extraer_postgres()` — lee las tablas vía JDBC (comportamiento original).
> - `extraer_mongo()` — lee las colecciones de Mongo. Como en Mongo los items de
>   una orden están **embebidos** en un arreglo `items`, se usa `explode()` para
>   desanidarlos y dejarlos con la misma forma que `order_item` de Postgres.
>
> Ambos extractores devuelven el mismo formato (tres DataFrames normalizados), así
> que el resto del pipeline es idéntico para las dos fuentes. También se actualizó
> el conector de Mongo a `mongo-spark-connector 10.2.1` (la versión `3.0.2` original
> no es compatible con Spark 3.4).

### B. Transformación (Transform)
Aquí ocurre el trabajo pesado de análisis OLAP. Las tablas normalizadas se cruzan (Inner Joins) para generar un modelo desnormalizado (`df_fact`) que permite responder preguntas de negocio:
- **Corrección de Ambigüedad**: Al cruzar tablas, columnas como `id` se repiten. Se resolvió usando referencias exactas (ej. `df_orders["id"]`).
- > **🔄 Actualización (Paso 4)**: Al refactorizar el script para soportar las dos fuentes, los extractores ahora entregan DataFrames ya normalizados con nombres de columna estándar (`order_id`, `plate_id`, `quantity`, etc.) y `df_fact` se arma con `select` y alias explícitos. Esto elimina de raíz las ambigüedades de columnas repetidas, sin importar si los datos vienen de Postgres o de Mongo. La lógica de los tres análisis no cambió.
- **Análisis 1 (Tendencias de Consumo)**: Agrupa por producto y calcula los ingresos totales multiplicando el precio del plato por la cantidad vendida.
- **Análisis 2 (Horarios Pico)**: Extrae la hora de la fecha de creación del pedido y cuenta el volumen de órdenes.
- **Análisis 3 (Crecimiento Mensual)**: Agrupa por año y mes para medir el volumen de transacciones a lo largo del tiempo.

### C. Carga (Load)
- Spark activa el soporte para Hive (`enableHiveSupport()`).
- Verifica la existencia de la base de datos `restaurante_olap` en el Hive Metastore.
- Escribe los DataFrames procesados como tablas administradas en Hive (en formato Parquet, que es columnar y altamente comprimido), listas para ser consumidas por Airflow o Superset.

> **🔄 Actualización (Paso 4)**: Se detectó que `enableHiveSupport()` por sí solo no
> indica **dónde** está el metastore, por lo que Spark creaba un metastore local
> temporal (Derby) y **las tablas se perdían** al cerrar el contenedor. Se corrigió
> apuntando explícitamente al metastore externo:
> `.config("hive.metastore.uris", "thrift://hive-metastore:9083")` y fijando el
> directorio del warehouse en HDFS. Gracias a esto las tablas quedan **persistentes**
> y se pueden consultar después desde Beeline o Superset.

---

## 3. Guía de Ejecución

> **IMPORTANTE — Guía actualizada**: tras el Paso 4 (orquestación con Airflow,
> imágenes propias y soporte dual de bases de datos), la guía de ejecución
> completa y vigente está en **`docs/paso4_orquestacion_airflow.md`** (sección 5).
> Esta sección queda solo como referencia para correr el ETL de Spark **a mano**,
> sin Airflow.

### Cambios relevantes respecto a la versión original

- El servicio `spark-submit` ahora **construye una imagen propia** (`restaurante_spark:latest`) desde `Dockerfile.spark`, con el script ya incluido y límites de recursos. Por eso, tras cambiar `spark_etl.py` hay que reconstruir: `docker-compose build spark-submit`.
- **Ya no hay que editar `spark_etl.py` para usar Mongo.** El script detecta la variable `DB_TYPE` (`postgres` o `mongo`) y elige el extractor automáticamente. El valor correcto es `mongo` (no `mongodb`).
- Antes de correr el ETL es indispensable **poblar datos transaccionales** con `.\seed.ps1` (de lo contrario las tablas de Hive salen vacías).

### Ejecución manual del ETL (sin Airflow)

1. Asegúrate de que el `.env` tenga el `DB_TYPE` deseado (`postgres` o `mongo`).
2. Construye la imagen de Spark (solo si cambiaste el script):
   ```powershell
   docker-compose build spark-submit
   ```
3. Levanta la base de datos correspondiente y puébla­la:
   ```powershell
   # Postgres
   docker-compose up -d db
   .\seed.ps1
   # (o, para Mongo) docker-compose --profile mongo up -d
   ```
4. Levanta la infraestructura analítica (Hadoop/Hive):
   ```powershell
   docker-compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
   ```
5. Ejecuta el ETL de Spark (contenedor temporal que se autodestruye):
   ```powershell
   docker-compose --profile spark-job run --rm spark-submit
   ```

Para el flujo **orquestado y programado con Airflow** (el principal del proyecto),
sigue la guía completa en `docs/paso4_orquestacion_airflow.md`.

---

# 🆕 Actualización Proyecto 2 — Esquema Estrella + Cubos OLAP

> **Para el PDF:** esta sección documenta el cambio más importante del pipeline en
> el Proyecto 2. Antes el ETL solo producía 3 tablas agregadas sueltas; ahora
> construye un **Data Warehouse dimensional completo** y los **cubos OLAP** que
> alimentan los dashboards. Apunta aquí lo que falte trasladar al documento final
> (incluye sugerencias de diagramas al final).

## 1. Qué cambió y por qué

El ETL (`dags/scripts/spark_etl.py`) ahora **llena dos bases en Hive en una sola corrida**:

1. **`restaurante_dw` — Esquema Estrella (modelo dimensional).** Antes `hive_scripts/init_schema.hql` *definía* este esquema pero **nadie lo llenaba** (estaba huérfano y vacío). Ahora el ETL lo puebla. Tablas:
   - **Hechos:** `fact_detalle_ordenes` (grano = línea de pedido; métricas: `cantidad_comprada`, `precio_unitario_historico`, `monto_total_linea`; FKs a las 5 dimensiones; atributos `estado_pedido`, `es_pickup`).
   - **Dimensiones:** `dim_tiempo`, `dim_usuario`, `dim_producto`, `dim_ubicacion`, `dim_restaurante`.
2. **`restaurante_olap` — Cubos / vistas OLAP pre-agregadas** (sirven directo a los dashboards de Metabase con `SELECT *`, sin recalcular nada):
   - Originales (las verifica el DAG): `tendencias_consumo`, `horarios_pico`, `crecimiento_mensual`.
   - Nuevos: `olap_ingresos_mes_categoria`, `olap_ingresos_categoria`, `olap_actividad_geografica`, `olap_pedidos_estado`, `olap_pedidos_mes_estado`.

Con esto se cumplen dos requisitos de la rúbrica que antes quedaban cortos: el DW pasa de "modelado pero vacío" a **funcional**, y se superan las **≥5 vistas OLAP** cubriendo las dimensiones pedidas (tiempo, **ubicación**, tipo de producto y frecuencia/estado).

## 2. Decisiones técnicas (clave para el PDF)

- **Dos paradigmas de Spark (a propósito).** La rúbrica pide *"Spark DataFrames y SparkSQL"*, así que el ETL usa ambos de forma deliberada: el **esquema estrella** (dimensiones + hechos) y los cubos de dashboards se arman con la **API de DataFrames**, mientras que los **3 análisis nombrados por el enunciado** (tendencias de consumo, horarios pico, crecimiento mensual) se implementan con **SparkSQL** (`createOrReplaceTempView` + `spark.sql("SELECT ...")`). Para el PDF esto se puede mostrar como "mismo dato, dos formas de transformarlo".
- **DW neutral a la fuente.** Los dos extractores (`extraer_postgres` y `extraer_mongo`) normalizan los datos al **mismo contrato de 10 DataFrames**, así que dimensiones, hechos y cubos se calculan con código idéntico sin importar la fuente. Consecuencia de diseño: los **dashboards se sirven desde Hive**, de modo que valen igual con `DB_TYPE=postgres` o `DB_TYPE=mongo`. (Si Metabase leyera de Postgres, los dashboards solo existirían para una de las dos fuentes.)
- **Paridad de `dim_ubicacion`.** La jerarquía geográfica (distrito→cantón→provincia) **no existe** en la fuente Mongo (solo `name + lat/long`). Para que ambas fuentes produzcan el mismo resultado, esa jerarquía se deja sin denormalizar; se pueblan `detalle`, `latitud`, `longitud` (lo que necesita el dashboard de mapa) y `pais` constante.
- **Definición de "ingresos".** Se consideran ingresos únicamente los pedidos efectivamente realizados: estados **`Completed` (13)** y **`Delivered` (22)**. El resto (Cancelled/Pending/Confirmed) no suma ingreso. Los conteos de *actividad* (pedidos/clientes por zona) sí usan todas las órdenes.
- **`id_tiempo` como surrogate key `yyyymmdd`** (ej. `20251015`), derivado igual en la dimensión y en los hechos para que la unión sea consistente.

## 3. Carga idempotente (reconstrucción del warehouse)

El ETL **reconstruye el warehouse en cada corrida**. Antes de escribir cada base, `preparar_db()`:
1. `DROP DATABASE ... CASCADE` (limpia el metastore), y
2. borra la carpeta de la base en **HDFS** vía la API de FileSystem.

**Por qué:** sin esto aparece el error `LOCATION_ALREADY_EXISTS` cuando queda un **directorio huérfano** en HDFS de una corrida previa (típico al resetear el metastore sin borrar el volumen de HDFS, o al cambiar el set de tablas que produce el ETL). Con la limpieza doble, el ETL siempre parte de cero y es seguro re-ejecutarlo.

## 4. Verificación (sin Metabase todavía)

Mientras Metabase no tenga el driver de Hive, el DW se valida con **Beeline** dentro de `hive-server`:
```powershell
docker exec -it hive-server beeline -u jdbc:hive2://localhost:10000 -e "SELECT COUNT(*) FROM restaurante_dw.fact_detalle_ordenes;"
```
`fact_detalle_ordenes` debe tener tantas filas como líneas de pedido (con el seed actual: **480**).

## 5. Sugerencias de diagramas para el PDF

- **Diagrama estrella:** `fact_detalle_ordenes` al centro con las 5 dimensiones alrededor (clásico esquema estrella).
- **Diagrama de flujo de datos (actualizado):** `PostgreSQL / MongoDB → (extractor según DB_TYPE) → DataFrames normalizados → [Esquema Estrella restaurante_dw] + [Cubos OLAP restaurante_olap] → Metabase (vía driver Hive)`.
- **Tabla de mapeo dashboard ↔ cubo OLAP:** Ingresos→`olap_ingresos_mes_categoria`/`olap_ingresos_categoria`; Geográfico→`olap_actividad_geografica`; Estados→`olap_pedidos_estado`/`olap_pedidos_mes_estado`.
