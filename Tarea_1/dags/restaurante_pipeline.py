"""
Pipeline ETL del Restaurante
============================
Orquesta el flujo completo de datos:
  T1: Verifica que la fuente de datos (PostgreSQL o MongoDB) y Hive estén listas
  T2: Ejecuta el job de Spark (extrae de la fuente, transforma, carga en Hive)
  T3: Verifica que las tablas se crearon en el Data Warehouse (Hive via HDFS)
  T4: Reindexar ElasticSearch si el catálogo de productos cambió

La fuente se controla con la variable de entorno DB_TYPE (postgres | mongo),
tomada del .env. Dependencias: T1 >> T2 >> T3 >> T4
"""

import os
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.docker.operators.docker import DockerOperator

# Fuente de datos activa (la misma que usa el resto del sistema)
DB_TYPE = os.environ.get("DB_TYPE", "postgres").lower()

# Parámetros de conexión dentro de la red Docker (nombres de servicio, no localhost)
MONGO_URI = "mongodb://mongos1:27017,mongos2:27017"
MONGO_DB_NAME = "restaurant_db"

default_args = {
    "owner": "restaurante_team",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="restaurante_pipeline_etl",
    default_args=default_args,
    description="ETL: PostgreSQL/MongoDB → Spark → Hive DW → ElasticSearch reindex",
    schedule_interval="0 2 * * *",  # Cada día a las 2am
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["etl", "restaurante", "data-warehouse"],
) as dag:

    # =========================================================================
    # TASK 1: Verificar fuente de datos
    # Comprueba que la fuente activa (PostgreSQL o MongoDB) responde antes de
    # lanzar Spark. También avisa si Hive no está activo (perfil "data").
    # =========================================================================
    def verificar_fuentes(**kwargs):
        import socket

        total_ordenes = "n/d"

        if DB_TYPE == "mongo":
            # --- Verificar MongoDB (test de conectividad TCP al router mongos) ---
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            mongo_ok = sock.connect_ex(("mongos1", 27017)) == 0
            sock.close()
            if not mongo_ok:
                raise Exception("No se puede conectar a MongoDB (mongos1:27017). "
                                "¿Está levantado el perfil 'mongo'?")
            print("MongoDB OK — mongos1:27017 accesible")
        else:
            # --- Verificar PostgreSQL (conexión + conteo de datos) ---
            import psycopg2
            try:
                conn = psycopg2.connect(
                    host=os.environ.get("DB_HOST", "db"),
                    port=int(os.environ.get("DB_PORT", "5432")),
                    database=os.environ.get("DB_NAME", "restaurante_db"),
                    user=os.environ.get("DB_USERNAME", "restaurante_admin"),
                    password=os.environ.get("DB_PASSWORD", "changeme"),
                )
                cur = conn.cursor()
                cur.execute('SELECT COUNT(*) FROM "order"')
                total_ordenes = cur.fetchone()[0]
                cur.execute('SELECT COUNT(*) FROM "plate"')
                total_platos = cur.fetchone()[0]
                conn.close()
                print(f"PostgreSQL OK — ordenes: {total_ordenes}, platos: {total_platos}")
            except Exception as exc:
                raise Exception(f"No se puede conectar a PostgreSQL: {exc}")

        # --- Verificar HiveServer2 (puerto TCP 10000) ---
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        hive_ok = sock.connect_ex(("hive-server", 10000)) == 0
        sock.close()
        if hive_ok:
            print("HiveServer2 OK en puerto 10000")
        else:
            print("AVISO: HiveServer2 no accesible. Asegurate de iniciar el perfil 'data'.")

        return {"fuente": DB_TYPE, "ordenes": total_ordenes}

    t1_verificar = PythonOperator(
        task_id="verificar_fuentes_datos",
        python_callable=verificar_fuentes,
    )

    # =========================================================================
    # TASK 2: Ejecutar el job de Spark (ETL completo)
    # DockerOperator lanza el contenedor "restaurante_spark:latest" (construido
    # desde Dockerfile.spark) usando el socket de Docker del host.
    # El contenedor queda en la misma red "app-network" que PostgreSQL y Hive,
    # por lo que puede conectarse a ambos directamente.
    # =========================================================================
    t2_spark_etl = DockerOperator(
        task_id="ejecutar_spark_etl",
        image="restaurante_spark:latest",
        # Usa el socket de Docker montado en el scheduler (ver docker-compose.yml)
        docker_url="unix://var/run/docker.sock",
        # Misma red que db, hive-server, etc.
        network_mode="app-network",
        environment={
            # DB_TYPE decide si el script lee de Postgres o de Mongo.
            # Las credenciales se toman del entorno del scheduler (vienen del .env
            # via docker-compose), NO hardcodeadas, para que coincidan con la BD real.
            "DB_TYPE": DB_TYPE,
            "DB_HOST": os.environ.get("DB_HOST", "db"),
            "DB_PORT": os.environ.get("DB_PORT", "5432"),
            "DB_USERNAME": os.environ.get("DB_USERNAME", "restaurante_admin"),
            "DB_PASSWORD": os.environ.get("DB_PASSWORD", "changeme"),
            "DB_NAME": os.environ.get("DB_NAME", "restaurante_db"),
            "MONGO_URI": MONGO_URI,
            "MONGO_DB_NAME": MONGO_DB_NAME,
        },
        # Eliminar el contenedor al terminar (éxito o fallo)
        auto_remove=True,
        # Captura logs del contenedor en los logs de Airflow
        mount_tmp_dir=False,
        # Topes de recursos para no saturar la máquina
        mem_limit="3g",
        cpus=2,
        # Sin reintentos en esta tarea: un fallo NO debe lanzar un 2º contenedor Spark
        # (evita que se acumulen contenedores si la máquina va lenta)
        retries=0,
    )

    # =========================================================================
    # TASK 3: Verificar que los datos se cargaron en Hive
    # Consulta la API REST de HDFS (WebHDFS) para comprobar que Spark creó las
    # tablas en el namenode. El ETL escribe en DOS bases (ver spark_etl.py):
    #   - restaurante_dw   -> esquema estrella (5 dimensiones + tabla de hechos)
    #   - restaurante_olap -> cubos OLAP pre-agregados (3 originales + 5 nuevos)
    # Se verifican ambas y se avisa de cualquier tabla faltante por base.
    # =========================================================================
    # Tablas que el ETL DEBE producir en cada base de Hive.
    TABLAS_ESPERADAS = {
        "restaurante_dw": {
            "dim_tiempo", "dim_usuario", "dim_producto", "dim_ubicacion",
            "dim_restaurante", "fact_detalle_ordenes",
        },
        "restaurante_olap": {
            # 3 cubos originales
            "tendencias_consumo", "horarios_pico", "crecimiento_mensual",
            # 5 cubos nuevos que alimentan los dashboards de Metabase
            "olap_ingresos_mes_categoria", "olap_ingresos_categoria",
            "olap_actividad_geografica", "olap_pedidos_estado",
            "olap_pedidos_mes_estado",
        },
    }

    def verificar_hive(**kwargs):
        import requests

        # WebHDFS permite listar directorios en HDFS via HTTP
        base_url = "http://namenode:9870/webhdfs/v1"

        def verificar_base(db, esperadas):
            """Lista la carpeta de una base en HDFS y avisa de tablas faltantes."""
            url = f"{base_url}/user/hive/warehouse/{db}.db?op=LISTSTATUS"
            try:
                response = requests.get(url, timeout=15, allow_redirects=True)
            except requests.exceptions.ConnectionError:
                print("AVISO: Namenode no accesible via WebHDFS (puerto 9870).")
                print("Verifica que el perfil 'data' esté activo.")
                return

            if response.status_code == 200:
                archivos = response.json().get("FileStatuses", {}).get("FileStatus", [])
                encontradas = {f["pathSuffix"] for f in archivos}
                print(f"[{db}] Tablas en HDFS: {sorted(encontradas)}")
                faltantes = esperadas - encontradas
                if faltantes:
                    print(f"[{db}] AVISO: Tablas no encontradas en HDFS: {sorted(faltantes)}")
                else:
                    print(f"[{db}] Las {len(esperadas)} tablas esperadas fueron creadas correctamente.")
            elif response.status_code == 404:
                print(f"[{db}] AVISO: El directorio '{db}.db' no existe en HDFS.")
                print("Puede que el job de Spark no haya completado la escritura en Hive.")
            else:
                print(f"[{db}] Respuesta inesperada de WebHDFS: HTTP {response.status_code}")

        for db, esperadas in TABLAS_ESPERADAS.items():
            verificar_base(db, esperadas)

        # Info de la fuente procesada (viene de T1 via XCom)
        ti = kwargs["ti"]
        info = ti.xcom_pull(task_ids="verificar_fuentes_datos")
        if info:
            print(f"Fuente procesada: {info.get('fuente')} — ordenes en origen: {info.get('ordenes')}")

    t3_verificar_hive = PythonOperator(
        task_id="verificar_tablas_hive",
        python_callable=verificar_hive,
    )

    # =========================================================================
    # TASK 4: Reindexar ElasticSearch
    # Llama al endpoint POST /search/reindex del search-service para sincronizar
    # el catálogo de productos con el índice de búsqueda.
    # Si el search-service no está disponible, avisa pero NO falla el pipeline.
    # =========================================================================
    def reindexar_elasticsearch(**kwargs):
        import requests

        url = "http://search-service:3001/search/reindex"

        try:
            print(f"Llamando a {url}...")
            response = requests.post(url, timeout=60)
            response.raise_for_status()
            resultado = response.json()
            print(f"ElasticSearch reindexado correctamente: {resultado}")
            return resultado
        except requests.exceptions.ConnectionError:
            # No fallamos el pipeline si search-service está apagado
            print("AVISO: search-service no disponible. Omitiendo reindexado.")
            print("Para activarlo: docker-compose up -d elasticsearch search-service")
            return None
        except requests.exceptions.HTTPError as exc:
            raise Exception(f"Error al reindexar ElasticSearch: {exc}")

    t4_reindexar = PythonOperator(
        task_id="reindexar_elasticsearch",
        python_callable=reindexar_elasticsearch,
    )

    # =========================================================================
    # DEPENDENCIAS del pipeline
    # =========================================================================
    t1_verificar >> t2_spark_etl >> t3_verificar_hive >> t4_reindexar
