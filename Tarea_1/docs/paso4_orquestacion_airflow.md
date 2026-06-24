# Documentación y Estudio: Paso 4 - Orquestación con Apache Airflow

Este documento explica la implementación de la **orquestación del pipeline de datos** con Apache Airflow, el poblado de datos transaccionales, el soporte dual PostgreSQL/MongoDB y todas las decisiones de diseño tomadas. Sirve como **guía de estudio**, base para la **documentación final** y soporte para la **defensa** del proyecto.

Al final encontrarás la **Guía de Ejecución actualizada** (la definitiva tras los cambios de este paso).

> **🆕 Actualización (Proyecto 2):** desde esta etapa el ETL ya no escribe solo 3 tablas
> agregadas: construye el **esquema estrella completo** (`restaurante_dw`: 5 dimensiones +
> `fact_detalle_ordenes`) y **8 cubos/vistas OLAP** (`restaurante_olap`) que alimentan los
> dashboards de Metabase. Además, los 3 análisis nombrados (tendencias, horarios pico,
> crecimiento) se implementan con **SparkSQL** (el esquema estrella usa DataFrames), y el
> DAG toma las **credenciales de Postgres del `.env`** usando las coordenadas internas
> `db:5432` (no hardcodeadas, no `localhost:5433`). Detalle ampliado en
> `Guia_Estudio_ETL_Spark.md` → sección "Actualización Proyecto 2".

---

## Índice
1. [Resumen de lo implementado](#1-resumen-de-lo-implementado)
2. [Cómo funciona el sistema (explicación sencilla)](#2-cómo-funciona-el-sistema-explicación-sencilla)
3. [Decisiones técnicas y justificación (para la defensa)](#3-decisiones-técnicas-y-justificación-para-la-defensa)
4. [Errores que enfrentamos y cómo los resolvimos](#4-errores-que-enfrentamos-y-cómo-los-resolvimos)
5. [Guía de Ejecución actualizada](#5-guía-de-ejecución-actualizada)

---

## 1. Resumen de lo implementado

En este paso conectamos todas las piezas del pipeline analítico en un **flujo automatizado y programado** usando Apache Airflow. Hasta el paso 3 teníamos el script de Spark que había que correr a mano; ahora un **DAG** (el "plano" del flujo de trabajo en Airflow) ejecuta todo el proceso de principio a fin de forma ordenada y repetible.

Concretamente, en este paso:

- **Creamos el DAG** `restaurante_pipeline_etl` con 4 tareas encadenadas: verificar fuente → ejecutar Spark → verificar carga en Hive → reindexar ElasticSearch.
- **Empaquetamos Spark y Airflow en imágenes propias** (`Dockerfile.spark` y `Dockerfile.airflow`) para que el flujo sea estable y reproducible.
- **Poblamos datos transaccionales realistas** (usuarios, platos, ~240 órdenes) tanto en PostgreSQL como en MongoDB, porque sin datos el Data Warehouse quedaba vacío.
- **Unificamos el soporte de ambas bases de datos**: el mismo pipeline funciona con `DB_TYPE=postgres` o `DB_TYPE=mongo` cambiando una sola variable.
- **Ajustamos el consumo de recursos** para que todo corra en una máquina modesta sin congelarse.

---

## 2. Cómo funciona el sistema (explicación sencilla)

### 2.1 ¿Qué es un DAG y por qué lo usamos?

Un **DAG** (Directed Acyclic Graph, "grafo dirigido acíclico") es la forma en que Airflow representa un flujo de trabajo: una serie de **tareas** con un orden de dependencias entre ellas. "Acíclico" significa que no hay ciclos: el flujo siempre avanza, nunca se devuelve.

Nuestro DAG vive en `dags/restaurante_pipeline.py` y define este flujo:

```
verificar_fuentes_datos → ejecutar_spark_etl → verificar_tablas_hive → reindexar_elasticsearch
   (Tarea 1)                  (Tarea 2)              (Tarea 3)                (Tarea 4)
```

La flecha significa "tiene que terminar antes de que empiece la siguiente". Airflow se encarga de ejecutarlas en orden, reintentar si algo falla, guardar los logs de cada una y mostrar todo en una interfaz web.

### 2.2 Qué hace cada tarea

| Tarea | Operador de Airflow | Qué hace |
|-------|--------------------|----------|
| **1. verificar_fuentes_datos** | `PythonOperator` | Confirma que la base de datos activa (Postgres o Mongo) responde y, si es Postgres, cuenta cuántas órdenes y platos hay. También avisa si Hive no está disponible. Es una "compuerta" que evita lanzar Spark si la fuente no está lista. |
| **2. ejecutar_spark_etl** | `DockerOperator` | Lanza el contenedor de Spark que hace el ETL completo (extrae datos, los transforma y los carga en Hive). Esta es la tarea central. |
| **3. verificar_tablas_hive** | `PythonOperator` | Pregunta a HDFS (vía su API web, WebHDFS) si las 3 tablas del Data Warehouse fueron creadas. Es la validación de integridad. |
| **4. reindexar_elasticsearch** | `PythonOperator` | Llama al endpoint `/search/reindex` del search-service para sincronizar el catálogo de productos con el buscador. Si el servicio no está arriba, lo omite sin romper el pipeline. |

### 2.3 La pieza clave: cómo Airflow ejecuta Spark (DockerOperator)

Esta es la parte más importante de entender para la defensa. Airflow corre **dentro de un contenedor**, pero necesita lanzar **otro contenedor** (el de Spark). ¿Cómo lo hace?

Usamos el patrón **"Docker hermano" (sibling container)**:

1. Al contenedor del `airflow-scheduler` le **montamos el socket de Docker del host** (`/var/run/docker.sock`). El socket es el "canal de control" de Docker.
2. Cuando la Tarea 2 se ejecuta, el `DockerOperator` usa ese socket para pedirle al Docker del host: *"crea un contenedor nuevo con la imagen `restaurante_spark:latest`"*.
3. Ese contenedor de Spark nace en la **misma red** (`app-network`) que PostgreSQL, Mongo y Hive, así que puede conectarse a todos ellos directamente por su nombre de servicio.
4. Cuando Spark termina, el contenedor se elimina solo (`auto_remove=True`).

```
   Host (tu máquina) ──── Docker Engine
          │                    ▲
          │  monta socket      │ "créame un contenedor Spark"
          ▼                    │
   ┌──────────────────┐        │
   │ airflow-scheduler│────────┘
   └──────────────────┘
                          ┌──────────────┐
   se crea como hermano → │ spark (ETL)  │ → lee Postgres/Mongo, escribe Hive
                          └──────────────┘
```

### 2.4 El soporte dual PostgreSQL / MongoDB

El proyecto permite elegir la base de datos con la variable `DB_TYPE` en el `.env`. El pipeline respeta esa decisión:

- El script `spark_etl.py` tiene dos extractores: `extraer_postgres()` y `extraer_mongo()`.
- Según `DB_TYPE`, usa uno u otro, pero **ambos producen el mismo formato** (diez DataFrames normalizados: órdenes, items, platos, usuarios, ubicaciones, categorías, estados, restaurantes, menús y roles). De ahí en adelante, las transformaciones (esquema estrella + cubos OLAP) y la carga a Hive son idénticas.
- La diferencia principal entre las dos fuentes: en PostgreSQL los items de una orden están en la tabla `order_item`; en MongoDB están **embebidos** dentro de cada documento de orden (campo `items: [...]`). Para igualarlos, en Mongo usamos `explode()`, que convierte ese arreglo en una fila por cada item, quedando idéntico a `order_item`.

### 2.5 Los datos de prueba (seed)

Sin datos transaccionales, el ETL corría pero el Data Warehouse quedaba **vacío**. Por eso creamos un seed que genera datos realistas:

- **Postgres**: `backend/seed/05_transactional.sql` (se ejecuta con `seed.ps1`).
- **Mongo**: ampliamos `backend/infra-mongo/seed.js` (se ejecuta solo vía `init.sh`).

Ambos generan los mismos datos lógicos: 12 usuarios, 18 platos, 3 restaurantes y ~240 órdenes. Lo importante es que **los datos están diseñados para que los análisis tengan sentido** (ver sección 3.8).

---

## 3. Decisiones técnicas y justificación (para la defensa)

### 3.1 ¿Por qué `DockerOperator` y no `SparkSubmitOperator`?

- **Decisión**: ejecutar Spark con `DockerOperator` (lanzando un contenedor) en lugar del `SparkSubmitOperator` clásico.
- **Por qué**: el `SparkSubmitOperator` requiere que Airflow tenga instalado Spark y Java localmente, o que exista un clúster Spark permanente al cual enviar el trabajo. Ambas opciones consumen más RAM y complican la imagen de Airflow. Con `DockerOperator` reutilizamos la **misma imagen efímera de Spark** del paso 3: el motor solo existe mientras dura el cálculo y luego desaparece. Es coherente con la decisión original de usar un Spark temporal para ahorrar recursos.

### 3.2 ¿Por qué una imagen propia de Airflow (`Dockerfile.airflow`)?

- **Decisión**: construir una imagen personalizada que instala los *providers* (`apache-airflow-providers-docker` y `psycopg2-binary`) en tiempo de **construcción**.
- **Por qué**: Airflow no trae el `DockerOperator` por defecto; hay que instalar el provider. La forma "rápida" es la variable `_PIP_ADDITIONAL_REQUIREMENTS`, que instala los paquetes **cada vez que arranca el contenedor**. Esto resultó frágil: el scheduler entraba en un **bucle de reinicios** (ver sección 4.2). Instalar las dependencias dentro de la imagen las deja listas de una vez, el arranque es rápido y estable, y es además la práctica recomendada por la documentación oficial de Airflow para producción.

### 3.3 ¿Por qué una imagen propia de Spark (`Dockerfile.spark`) en lugar de montar el script por volumen?

- **Decisión**: copiar el `spark_etl.py` **dentro** de la imagen (`COPY`) en vez de montarlo como volumen.
- **Por qué**: cuando Airflow lanza el contenedor de Spark a través del socket de Docker, ese contenedor lo crea el **Docker del host**, no Airflow. Un volumen `./dags/scripts:/...` se resolvería respecto a una ruta que el host no interpreta igual (problema típico en Windows). Al hornear el script dentro de la imagen, el contenedor es **autocontenido**: funciona sin importar desde dónde se lance. La contrapartida es que, al cambiar el script, hay que reconstruir la imagen (`docker-compose build spark-submit`).

### 3.4 ¿Por qué montar el socket de Docker y correr el scheduler con permisos especiales?

- **Decisión**: montar `/var/run/docker.sock` en el scheduler.
- **Por qué**: es lo que permite el patrón "contenedor hermano" (sección 2.3). Sin acceso al socket, Airflow no podría crear el contenedor de Spark. El usuario `airflow` de la imagen pertenece al grupo root (GID 0), lo que le da acceso al socket en Docker Desktop sin necesidad de privilegios adicionales.

### 3.5 ¿Por qué configurar `hive.metastore.uris` explícitamente en Spark?

- **Decisión**: añadir `.config("hive.metastore.uris", "thrift://hive-metastore:9083")` y la ruta del warehouse en HDFS al crear la `SparkSession`.
- **Por qué**: `enableHiveSupport()` por sí solo no le dice a Spark **dónde** está el metastore. Sin esa URI, Spark crea un metastore local temporal (Derby) y **las tablas se pierden** al terminar el contenedor. Apuntar al metastore externo es lo que hace que las tablas queden **persistentes** y consultables desde Beeline o Superset.

### 3.6 ¿Por qué la red Docker tiene un nombre fijo (`app-network`)?

- **Decisión**: forzar `name: app-network` en la definición de la red.
- **Por qué**: por defecto Docker Compose prefija el nombre del proyecto (ej. `tarea_1_app-network`). El `DockerOperator` necesita el nombre **exacto** de la red para conectar el contenedor de Spark. Fijar el nombre lo hace predecible y evita errores difíciles de diagnosticar.

### 3.7 ¿Por qué los topes de recursos (`.wslconfig`, heap de ES, `local[2]`, `mem_limit`)?

- **Decisión**: limitar la memoria de Elasticsearch (512 MB), correr Spark con solo 2 núcleos y 2 GB, poner `mem_limit` al contenedor de Spark y crear un `.wslconfig` con memoria y **swap** para Docker.
- **Por qué**: durante las pruebas, levantar Elasticsearch + Hadoop + Hive + Airflow + Spark a la vez **saturó la RAM** y congeló la máquina (ver sección 4.4). Como WSL2 no tenía swap, en lugar de ralentizarse se bloqueaba en seco. Estos límites hacen que el sistema **degrade suavemente** y quepa en una máquina modesta. Es una decisión de diseño consciente para priorizar que el proyecto sea **ejecutable** en el hardware disponible.

### 3.8 ¿Por qué generamos los datos de prueba "sesgados"?

- **Decisión**: en el seed, las órdenes no se distribuyen al azar uniforme, sino con **sesgos intencionales**.
- **Por qué**: para que los tres análisis OLAP muestren resultados **realistas e interesantes**, no planos:
  - **Horarios pico**: el 40 % de las órdenes cae en almuerzo (11–14h) y el 35 % en cena (18–21h), simulando el comportamiento real de un restaurante.
  - **Crecimiento mensual**: las fechas se concentran más en meses recientes, simulando un negocio que crece.
  - **Tendencias de consumo**: unos pocos platos son mucho más populares que el resto (distribución tipo Pareto), para que el "Top 10" tenga ganadores claros.
  - **Completadas vs. canceladas**: ~65 % completadas y ~10 % canceladas, una mezcla creíble.

### 3.9 ¿Por qué el conector de Mongo `10.2.1` y no `3.0.2`?

- **Decisión**: actualizar `mongo-spark-connector` de `3.0.2` a `10.2.1`.
- **Por qué**: la versión `3.0.2` no es compatible con Spark 3.4 y usa una API antigua (`format("mongo")`, `spark.mongodb.input.uri`). El código ya estaba escrito con la API nueva (`format("mongodb")`, `spark.mongodb.read.connection.uri`), que corresponde a la línea `10.x`. La `10.2.1` es la versión compatible con Spark 3.4 y con esa API.

### 3.10 ¿Por qué tareas tolerantes a fallos?

- **Decisión**: que la verificación de Hive y el reindexado de ElasticSearch **avisen pero no rompan** el pipeline si esos servicios no están.
- **Por qué**: para una máquina modesta queremos poder correr el núcleo del pipeline (Spark → Hive) sin obligar a levantar Elasticsearch. Si el search-service no está, la Tarea 4 simplemente lo registra en el log y termina. La Tarea 2 (Spark), en cambio, **sí es crítica** y no tiene reintentos automáticos, para evitar que un fallo lance un segundo contenedor pesado encima del primero.

---

## 4. Errores que enfrentamos y cómo los resolvimos

### 4.1 La carpeta `dags/` estaba en `.dockerignore`
- **Síntoma**: `COPY dags/scripts/spark_etl.py ... not found` al construir la imagen de Spark.
- **Causa**: el `.dockerignore` excluía toda la carpeta `dags/` (para no copiar logs de Airflow en otras imágenes).
- **Solución**: añadir una excepción `!dags/scripts/spark_etl.py`, que permite copiar ese archivo específico aunque el resto de `dags/` siga ignorado.

### 4.2 El scheduler de Airflow en bucle de reinicios
- **Síntoma**: el `airflow-scheduler` se reiniciaba sin parar, mostrando una y otra vez el mensaje de instalación de paquetes con pip.
- **Causa**: usábamos `_PIP_ADDITIONAL_REQUIREMENTS` para instalar el provider de Docker en el arranque, corriendo como root. Esto generaba conflictos de permisos y el scheduler no encontraba el provider, fallando de inmediato.
- **Solución**: mover la instalación a una imagen propia (`Dockerfile.airflow`) que instala los paquetes en tiempo de construcción.

### 4.3 `pip` bloqueado como root al construir la imagen
- **Síntoma**: `ERROR: ... You are running pip as root` al construir `Dockerfile.airflow`.
- **Causa**: la imagen oficial de Airflow bloquea a propósito el uso de pip como root.
- **Solución**: quitar el `USER root` del Dockerfile e instalar como el usuario `airflow` (lo recomendado oficialmente). Los paquetes quedan en `/home/airflow/.local`, que está en el PYTHONPATH del contenedor.

### 4.4 La máquina se congelaba al correr el DAG
- **Síntoma**: al ejecutar el pipeline, la PC llegaba a ~135 % de CPU y se congelaba; Docker devolvía errores 500 y quedaban contenedores "fantasma" de Spark sin eliminarse.
- **Causa**: demasiados servicios JVM pesados (Elasticsearch, Hadoop, Hive, Spark) compitiendo por la RAM, sin límites, y sin swap en WSL2 para amortiguar.
- **Solución**: límites de memoria/CPU (sección 3.7), arranque por olas y no levantar Elasticsearch durante la prueba del ETL.

### 4.5 Las tablas de Hive salían vacías
- **Síntoma**: el pipeline terminaba en verde pero `SELECT * FROM tendencias_consumo` no devolvía filas.
- **Causa**: el seed original (`seed.ps1`) solo cargaba catálogos de referencia (países, roles, estados, geografía), **no** datos transaccionales (usuarios, platos, órdenes). Spark agregaba sobre tablas vacías.
- **Solución**: crear el seed transaccional `05_transactional.sql` (Postgres) y ampliar `seed.js` (Mongo).

---

## 5. Guía de Ejecución actualizada

> Esta guía reemplaza a la del documento de Spark (Paso 3). Es la **versión vigente** tras todos los cambios. Sirve también como guion para el video de demostración.

### Paso 0 — Preparación de Docker (solo una vez)

Para que la máquina no se congele, configuramos los recursos de Docker. Crea (o verifica) el archivo `C:\Users\<tu_usuario>\.wslconfig` con:

```ini
[wsl2]
memory=10GB
processors=6
swap=4GB
```

Aplica el cambio cerrando Docker Desktop y ejecutando:

```powershell
wsl --shutdown
```

Espera 10 segundos y vuelve a abrir Docker Desktop. (Ajusta los valores si tu máquina tiene más o menos RAM.)

### Paso 1 — Construir las imágenes propias

Desde la carpeta del proyecto:

```powershell
cd C:\Users\50662\Documents\GitHub\Reserva-Inteligente-de-Restaurantes\Tarea_1
```

Construye la imagen de Airflow (tarda unos minutos la primera vez) y la de Spark:

```powershell
docker-compose --profile data build airflow-webserver
docker-compose build spark-submit
```

Verifica que ambas existan:

```powershell
docker images | findstr restaurante
```

Debes ver `restaurante_airflow` y `restaurante_spark`.

---

### Escenario A — PostgreSQL (predeterminado)

**A.1. Asegúrate de que el `.env` tenga `DB_TYPE=postgres`.**

**A.2. Levanta la base de datos y siémbrala:**

```powershell
docker-compose up -d db
```
Espera a que esté "healthy" (`docker-compose ps db`), luego:
```powershell
.\seed.ps1
```
Al final verás un resumen con la cantidad de usuarios, platos, órdenes e items.

**A.3. Levanta la infraestructura analítica (Airflow + Hadoop + Hive):**

```powershell
docker-compose --profile data up -d
```
Espera 3–5 minutos. Vigila el scheduler hasta ver "Scheduler started":
```powershell
docker logs -f airflow-scheduler
```
(Sal con `Ctrl+C` cuando aparezca.)

**A.4. Ejecuta el pipeline desde Airflow:**

1. Abre **http://localhost:8081** (usuario `admin`, contraseña `admin`).
2. Activa el DAG `restaurante_pipeline_etl` con el interruptor.
3. Entra al DAG, ve a la pestaña **Graph** y dispáralo con el botón ▶ ("Trigger DAG").
4. Observa cómo las 4 tareas pasan a verde. La Tarea 2 (Spark) es la más larga.

**A.5. Verifica los resultados en Hive:**

```powershell
docker exec -it hive-server /opt/hive/bin/beeline -u "jdbc:hive2://localhost:10000"
```
Dentro de Beeline (esquema estrella + cubos OLAP):
```sql
-- Esquema estrella (modelo dimensional)
SHOW TABLES IN restaurante_dw;
SELECT COUNT(*) FROM restaurante_dw.fact_detalle_ordenes;   -- = # de líneas de pedido (integridad)

-- Cubos / vistas OLAP (8 tablas, alimentan los dashboards)
SHOW TABLES IN restaurante_olap;
SELECT * FROM restaurante_olap.tendencias_consumo LIMIT 5;
SELECT * FROM restaurante_olap.olap_ingresos_mes_categoria;
SELECT * FROM restaurante_olap.olap_actividad_geografica;
```
Salir: `!quit`

---

### Escenario B — MongoDB (para tu compañero)

> Requiere una máquina con más recursos: el clúster Mongo son ~14 contenedores más los ~9 del perfil `data`.

**B.1.** Poner `DB_TYPE=mongo` en el `.env`.

**B.2.** Construir la imagen de Spark (si no se hizo): `docker-compose build spark-submit`.

**B.3.** Levantar el clúster Mongo (se puebla solo vía `init.sh` → `seed.js`):
```powershell
docker-compose --profile mongo up -d
```

**B.4.** Levantar la infraestructura analítica:
```powershell
docker-compose --profile data up -d
```

**B.5.** Recrear el scheduler para que tome `DB_TYPE=mongo`:
```powershell
docker-compose --profile data up -d --force-recreate airflow-scheduler
```

**B.6.** Ejecutar el DAG igual que en el Escenario A (pasos A.4 y A.5). Spark leerá de Mongo y escribirá el **mismo esquema estrella y los mismos 8 cubos OLAP** en Hive (debe quedar idéntico a Postgres — esa es la validación dual-source).

---

### Ejecución manual de Spark (sin Airflow, opcional)

Para probar solo el ETL sin pasar por Airflow (útil para depurar):

```powershell
docker-compose --profile data up -d namenode datanode hive-metastore-postgresql hive-metastore hive-server
docker-compose --profile spark-job run --rm spark-submit
```

---

### Checklist para el video de demostración

1. ✅ Mostrar el `.env` con `DB_TYPE=postgres`.
2. ✅ `docker-compose ps` mostrando los servicios sanos.
3. ✅ Correr `.\seed.ps1` y mostrar el resumen de datos insertados.
4. ✅ Abrir Airflow (8081), activar y disparar el DAG.
5. ✅ Mostrar el **Graph** con las 4 tareas en verde.
6. ✅ Abrir el log de la Tarea 2 mostrando "ETL completado exitosamente".
7. ✅ Entrar a Beeline y mostrar filas reales en las 3 tablas OLAP.

### Solución rápida de problemas

| Síntoma | Solución |
|---|---|
| `Image restaurante_spark:latest not found` | Falta construir la imagen: `docker-compose build spark-submit`. |
| El scheduler se reinicia | Reconstruir sin caché: `docker-compose --profile data build --no-cache airflow-webserver`. |
| El DAG no aparece en la UI | Esperar 30 s y recargar; revisar `docker logs airflow-scheduler` por errores de importación. |
| Tarea 2 falla con error de Hive | Hive aún arrancando; esperar 3–5 min y volver a disparar el DAG. |
| Las tablas salen vacías | No se corrió el seed transaccional; ejecutar `.\seed.ps1`. |
| La máquina se congela | Verificar el `.wslconfig` del Paso 0 y no levantar Elasticsearch durante la prueba. |
