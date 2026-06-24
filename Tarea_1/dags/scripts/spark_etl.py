import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, countDistinct, sum, hour, month, year, dayofmonth, dayofweek,
    date_format, to_date, desc, explode, lit, coalesce,
)

# =============================================================================
# ETL del Restaurante  (Paso 3 + Esquema Estrella / OLAP)
# =============================================================================
# Funciona con DOS fuentes de datos segun la variable de entorno DB_TYPE:
#   - postgres (por defecto): lee las tablas relacionales (order, order_item,
#     plate, user, location, category, status, restaurant, menu, role).
#   - mongo: lee las colecciones equivalentes de MongoDB (nombres en plural;
#     las ordenes EMBEBEN sus items en un arreglo 'items').
#
# Ambos extractores normalizan los datos al MISMO contrato de DataFrames, asi
# que todo lo que viene despues (dimensiones, hechos y cubos OLAP) es identico
# para las dos fuentes. Esto hace que el Data Warehouse sea neutral a la fuente:
# Metabase puede leer de Hive sin importar si los datos vinieron de Postgres o
# de Mongo.
#
# Salidas en Hive:
#   1. restaurante_dw   -> ESQUEMA ESTRELLA (modelo dimensional):
#        dim_tiempo, dim_usuario, dim_producto, dim_ubicacion, dim_restaurante,
#        fact_detalle_ordenes
#   2. restaurante_olap -> CUBOS / VISTAS OLAP pre-agregadas (para dashboards):
#        tendencias_consumo, horarios_pico, crecimiento_mensual,           (originales)
#        olap_ingresos_mes_categoria, olap_ingresos_categoria,
#        olap_actividad_geografica, olap_pedidos_estado, olap_pedidos_mes_estado
# =============================================================================


def get_postgres_df(spark, table_name):
    db_host = os.environ.get("DB_HOST", "db")
    db_port = os.environ.get("DB_PORT", "5432")
    db_name = os.environ.get("DB_NAME", "restaurante_db")
    db_user = os.environ.get("DB_USERNAME", "restaurante_admin")
    db_pass = os.environ.get("DB_PASSWORD", "changeme")

    jdbc_url = f"jdbc:postgresql://{db_host}:{db_port}/{db_name}"

    return spark.read \
        .format("jdbc") \
        .option("url", jdbc_url) \
        .option("dbtable", f'"{table_name}"') \
        .option("user", db_user) \
        .option("password", db_pass) \
        .option("driver", "org.postgresql.Driver") \
        .load()


def get_mongo_df(spark, collection_name):
    # Conector MongoDB Spark v10 (compatible con Spark 3.4). Usa la base y la
    # coleccion como opciones separadas en lugar de incluirlas en la URI.
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://mongos1:27017,mongos2:27017")
    mongo_db = os.environ.get("MONGO_DB_NAME", "restaurant_db")

    return spark.read \
        .format("mongodb") \
        .option("spark.mongodb.read.connection.uri", mongo_uri) \
        .option("spark.mongodb.read.database", mongo_db) \
        .option("spark.mongodb.read.collection", collection_name) \
        .load()


# -----------------------------------------------------------------------------
# EXTRACCION
# Cada extractor devuelve un dict con 10 DataFrames YA normalizados (mismos
# nombres y tipos de columna en ambas fuentes). Claves:
#   orders, order_items, plates, users, locations, categories, statuses,
#   restaurants, menus, roles
# -----------------------------------------------------------------------------
def extraer_postgres(spark):
    orders_raw = get_postgres_df(spark, "order")
    items_raw = get_postgres_df(spark, "order_item")
    plates_raw = get_postgres_df(spark, "plate")
    users_raw = get_postgres_df(spark, "user")
    locations_raw = get_postgres_df(spark, "location")
    categories_raw = get_postgres_df(spark, "category")
    statuses_raw = get_postgres_df(spark, "status")
    restaurants_raw = get_postgres_df(spark, "restaurant")
    menus_raw = get_postgres_df(spark, "menu")
    roles_raw = get_postgres_df(spark, "role")

    # TypeORM puede emitir las FKs de order_item en camelCase o snake_case.
    order_col = "orderId" if "orderId" in items_raw.columns else "order_id"
    plate_col = "plateId" if "plateId" in items_raw.columns else "plate_id"

    orders = orders_raw.select(
        col("id").cast("int").alias("id"),
        col("created_at"),
        col("user_id").cast("int").alias("user_id"),
        col("location_id").cast("int").alias("location_id"),
        col("status_id").cast("int").alias("status_id"),
        col("restaurant_id").cast("int").alias("restaurant_id"),
        col("pickup").cast("boolean").alias("pickup"),
    )
    order_items = items_raw.select(
        col(order_col).cast("int").alias("order_id"),
        col(plate_col).cast("int").alias("plate_id"),
        col("quantity").cast("int").alias("quantity"),
    )
    return _normalizar(
        orders, order_items, plates_raw, users_raw, locations_raw,
        categories_raw, statuses_raw, restaurants_raw, menus_raw, roles_raw,
    )


def extraer_mongo(spark):
    orders_raw = get_mongo_df(spark, "orders")
    plates_raw = get_mongo_df(spark, "plate")
    users_raw = get_mongo_df(spark, "users")
    locations_raw = get_mongo_df(spark, "locations")
    categories_raw = get_mongo_df(spark, "categories")
    statuses_raw = get_mongo_df(spark, "statuses")
    restaurants_raw = get_mongo_df(spark, "restaurants")
    menus_raw = get_mongo_df(spark, "menus")
    roles_raw = get_mongo_df(spark, "roles")

    orders = orders_raw.select(
        col("id").cast("int").alias("id"),
        col("created_at"),
        col("user_id").cast("int").alias("user_id"),
        col("location_id").cast("int").alias("location_id"),
        col("status_id").cast("int").alias("status_id"),
        col("restaurant_id").cast("int").alias("restaurant_id"),
        col("pickup").cast("boolean").alias("pickup"),
    )

    # En Mongo los items van EMBEBIDOS en la orden -> explode() para desanidarlos
    # y dejarlos con la misma forma que order_item de Postgres.
    order_items = orders_raw \
        .select(col("id").alias("order_id"), explode(col("items")).alias("item")) \
        .select(
            col("order_id").cast("int").alias("order_id"),
            col("item.plate_id").cast("int").alias("plate_id"),
            col("item.quantity").cast("int").alias("quantity"),
        )
    return _normalizar(
        orders, order_items, plates_raw, users_raw, locations_raw,
        categories_raw, statuses_raw, restaurants_raw, menus_raw, roles_raw,
    )


def _normalizar(orders, order_items, plates_raw, users_raw, locations_raw,
                categories_raw, statuses_raw, restaurants_raw, menus_raw, roles_raw):
    """Aplica el mismo select/cast a las tablas de catalogo en ambas fuentes."""
    plates = plates_raw.select(
        col("id").cast("int").alias("id"),
        col("name").alias("name"),
        col("category_id").cast("int").alias("category_id"),
        col("price").cast("double").alias("price"),
        col("menu_id").cast("int").alias("menu_id"),
    )
    users = users_raw.select(
        col("id").cast("int").alias("id"),
        col("created_at"),
        col("role_id").cast("int").alias("role_id"),
        col("is_active").cast("boolean").alias("is_active"),
    )
    locations = locations_raw.select(
        col("id").cast("int").alias("id"),
        col("name").alias("name"),
        col("latitude").cast("double").alias("latitude"),
        col("longitude").cast("double").alias("longitude"),
    )
    categories = categories_raw.select(
        col("id").cast("int").alias("id"), col("name").alias("name"))
    statuses = statuses_raw.select(
        col("id").cast("int").alias("id"), col("name").alias("name"))
    restaurants = restaurants_raw.select(
        col("id").cast("int").alias("id"), col("name").alias("name"))
    menus = menus_raw.select(
        col("id").cast("int").alias("id"), col("name").alias("name"))
    roles = roles_raw.select(
        col("id").cast("int").alias("id"), col("name").alias("name"))

    return {
        "orders": orders,
        "order_items": order_items,
        "plates": plates,
        "users": users,
        "locations": locations,
        "categories": categories,
        "statuses": statuses,
        "restaurants": restaurants,
        "menus": menus,
        "roles": roles,
    }


# -----------------------------------------------------------------------------
# TRANSFORMACION: Esquema Estrella (restaurante_dw)
# -----------------------------------------------------------------------------
def construir_dimensiones(d):
    """Devuelve un dict {nombre_tabla: DataFrame} con las 5 dimensiones."""

    # --- Dim_Tiempo: una fila por dia presente en las ordenes -----------------
    dim_tiempo = d["orders"] \
        .select(to_date("created_at").alias("fecha_completa")) \
        .where(col("fecha_completa").isNotNull()) \
        .distinct() \
        .withColumn("id_tiempo",
                    (year("fecha_completa") * 10000
                     + month("fecha_completa") * 100
                     + dayofmonth("fecha_completa")).cast("int")) \
        .withColumn("dia", dayofmonth("fecha_completa")) \
        .withColumn("mes", month("fecha_completa")) \
        .withColumn("anio", year("fecha_completa")) \
        .withColumn("nombre_dia", date_format("fecha_completa", "EEEE")) \
        .withColumn("es_fin_de_semana", dayofweek("fecha_completa").isin(1, 7)) \
        .select("id_tiempo", "fecha_completa", "dia", "mes", "anio",
                "nombre_dia", "es_fin_de_semana")

    # --- Dim_Usuario ----------------------------------------------------------
    dim_usuario = d["users"].alias("u") \
        .join(d["roles"].alias("r"), col("u.role_id") == col("r.id"), "left") \
        .select(
            col("u.id").alias("id_usuario"),
            to_date(col("u.created_at")).alias("fecha_registro"),
            col("r.name").alias("rol"),
            col("u.is_active").alias("estado_activo"),
        )

    # --- Dim_Producto ---------------------------------------------------------
    dim_producto = d["plates"].alias("p") \
        .join(d["categories"].alias("c"), col("p.category_id") == col("c.id"), "left") \
        .join(d["menus"].alias("m"), col("p.menu_id") == col("m.id"), "left") \
        .select(
            col("p.id").alias("id_producto"),
            col("p.name").alias("nombre_producto"),
            col("c.name").alias("categoria_producto"),
            col("m.name").alias("nombre_menu"),
        )

    # --- Dim_Ubicacion --------------------------------------------------------
    # distrito/canton/provincia NO se denormalizan: la jerarquia geografica no
    # existe en la fuente Mongo, asi que para mantener PARIDAD entre fuentes solo
    # poblamos lo que ambas tienen (detalle + coordenadas). pais es constante.
    dim_ubicacion = d["locations"].select(
        col("id").alias("id_ubicacion"),
        col("name").alias("detalle"),
        lit(None).cast("string").alias("distrito"),
        lit(None).cast("string").alias("canton"),
        lit(None).cast("string").alias("provincia"),
        lit("Costa Rica").alias("pais"),
        col("latitude").alias("latitud"),
        col("longitude").alias("longitud"),
    )

    # --- Dim_Restaurante ------------------------------------------------------
    dim_restaurante = d["restaurants"].select(
        col("id").alias("id_restaurante"),
        col("name").alias("nombre_restaurante"),
    )

    return {
        "dim_tiempo": dim_tiempo,
        "dim_usuario": dim_usuario,
        "dim_producto": dim_producto,
        "dim_ubicacion": dim_ubicacion,
        "dim_restaurante": dim_restaurante,
    }


def construir_lineas(d):
    """DataFrame a nivel de LINEA (item) enriquecido. Es la base tanto de la
    tabla de hechos como de los cubos OLAP de producto/ingresos."""
    return d["order_items"].alias("oi") \
        .join(d["orders"].alias("o"), col("oi.order_id") == col("o.id"), "inner") \
        .join(d["plates"].alias("p"), col("oi.plate_id") == col("p.id"), "inner") \
        .join(d["categories"].alias("c"), col("p.category_id") == col("c.id"), "left") \
        .join(d["statuses"].alias("s"), col("o.status_id") == col("s.id"), "left") \
        .select(
            col("o.created_at").alias("created_at"),
            col("o.user_id").alias("id_usuario"),
            col("oi.plate_id").alias("id_producto"),
            col("o.location_id").alias("id_ubicacion"),
            col("o.restaurant_id").alias("id_restaurante"),
            col("p.name").alias("producto"),
            col("c.name").alias("categoria"),
            col("oi.quantity").alias("cantidad_comprada"),
            col("p.price").alias("precio_unitario_historico"),
            (col("p.price") * col("oi.quantity")).cast("double").alias("monto_total_linea"),
            col("s.name").alias("estado_pedido"),
            col("o.pickup").alias("es_pickup"),
        ) \
        .withColumn("anio", year("created_at")) \
        .withColumn("mes", month("created_at")) \
        .withColumn("periodo", date_format("created_at", "yyyy-MM")) \
        .withColumn("id_tiempo",
                    (year("created_at") * 10000
                     + month("created_at") * 100
                     + dayofmonth("created_at")).cast("int"))


def construir_hechos(df_lineas):
    """Proyecta la linea enriquecida al esquema exacto de Fact_Detalle_Ordenes."""
    return df_lineas.select(
        col("id_tiempo").cast("int"),
        col("id_usuario").cast("int"),
        col("id_producto").cast("int"),
        col("id_ubicacion").cast("int"),
        col("id_restaurante").cast("int"),
        col("cantidad_comprada").cast("int"),
        col("precio_unitario_historico").cast("double"),
        col("monto_total_linea").cast("double"),
        col("estado_pedido"),
        col("es_pickup").cast("boolean"),
    )


# -----------------------------------------------------------------------------
# TRANSFORMACION: Cubos / Vistas OLAP (restaurante_olap)
# -----------------------------------------------------------------------------
# "Ingresos" = pedidos efectivamente realizados (Completed + Delivered). El
# resto de estados no genera ingreso.
ESTADOS_INGRESO = ["Completed", "Delivered"]


def construir_olap(spark, d, df_lineas):
    """Devuelve {nombre_tabla: DataFrame} con los cubos pre-agregados.

    Se usan DELIBERADAMENTE los dos paradigmas de Spark que pide la rúbrica:
      - **SparkSQL** (createOrReplaceTempView + spark.sql) para los 3 análisis
        nombrados por el enunciado (tendencias, horarios pico, crecimiento).
      - **DataFrames** (API funcional) para los cubos que alimentan dashboards.
    """
    df_orders = d["orders"]
    realizadas = df_lineas.where(col("estado_pedido").isin(ESTADOS_INGRESO))

    # === Análisis nombrados por la rúbrica -> implementados con SparkSQL ======
    # Registramos vistas temporales para poder consultarlas con SQL puro.
    df_lineas.createOrReplaceTempView("lineas")
    df_orders.createOrReplaceTempView("ordenes")

    # 1. Tendencias de consumo: top 10 productos mas vendidos
    tendencias_consumo = spark.sql("""
        SELECT producto,
               categoria,
               SUM(cantidad_comprada) AS cantidad_vendida,
               SUM(monto_total_linea) AS ingreso_total
        FROM lineas
        GROUP BY producto, categoria
        ORDER BY cantidad_vendida DESC
        LIMIT 10
    """)

    # 2. Horarios pico: volumen de ordenes por hora del dia
    horarios_pico = spark.sql("""
        SELECT HOUR(created_at) AS hora,
               COUNT(id)        AS total_pedidos
        FROM ordenes
        GROUP BY HOUR(created_at)
        ORDER BY total_pedidos DESC
    """)

    # 3. Crecimiento mensual: volumen de ordenes por anio/mes
    crecimiento_mensual = spark.sql("""
        SELECT YEAR(created_at)                   AS anio,
               MONTH(created_at)                  AS mes,
               DATE_FORMAT(created_at, 'yyyy-MM') AS periodo,
               COUNT(id)                          AS total_pedidos
        FROM ordenes
        GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, 'yyyy-MM')
        ORDER BY anio, mes
    """)

    # === Nuevos cubos que respaldan los 3 dashboards obligatorios =============
    # D1 - Ingresos por mes y categoria (eje X = periodo, serie = categoria)
    olap_ingresos_mes_categoria = realizadas \
        .groupBy("anio", "mes", "periodo", "categoria") \
        .agg(sum("monto_total_linea").alias("ingresos")) \
        .orderBy("anio", "mes", "categoria")

    # D1 - Participacion de ingresos por categoria (pie)
    olap_ingresos_categoria = realizadas \
        .groupBy("categoria") \
        .agg(sum("monto_total_linea").alias("ingresos")) \
        .orderBy(desc("ingresos"))

    # D2 - Actividad de clientes por zona geografica (mapa + barras)
    #   pedidos/clientes = actividad (todas las ordenes);
    #   ingresos = realizado (Completed + Delivered).
    actividad = df_orders.groupBy("location_id") \
        .agg(countDistinct("id").alias("pedidos"),
             countDistinct("user_id").alias("clientes"))
    ingresos_zona = realizadas.groupBy("id_ubicacion") \
        .agg(sum("monto_total_linea").alias("ingresos"))
    olap_actividad_geografica = d["locations"].alias("l") \
        .join(actividad.alias("a"), col("l.id") == col("a.location_id"), "left") \
        .join(ingresos_zona.alias("i"), col("l.id") == col("i.id_ubicacion"), "left") \
        .select(
            col("l.name").alias("zona"),
            col("l.latitude").alias("latitud"),
            col("l.longitude").alias("longitud"),
            coalesce(col("a.pedidos"), lit(0)).alias("pedidos"),
            coalesce(col("a.clientes"), lit(0)).alias("clientes"),
            coalesce(col("i.ingresos"), lit(0.0)).alias("ingresos"),
        ) \
        .orderBy(desc("pedidos"))

    # D3 - Distribucion de pedidos por estado (pie)
    olap_pedidos_estado = df_orders.alias("o") \
        .join(d["statuses"].alias("s"), col("o.status_id") == col("s.id"), "left") \
        .groupBy(col("s.name").alias("estado")) \
        .agg(count("o.id").alias("pedidos")) \
        .orderBy(desc("pedidos"))

    # D3 - Pedidos por mes y estado (completados vs cancelados a lo largo del tiempo)
    olap_pedidos_mes_estado = df_orders.alias("o") \
        .join(d["statuses"].alias("s"), col("o.status_id") == col("s.id"), "left") \
        .withColumn("anio", year("created_at")) \
        .withColumn("mes", month("created_at")) \
        .withColumn("periodo", date_format("created_at", "yyyy-MM")) \
        .groupBy("anio", "mes", "periodo", col("s.name").alias("estado")) \
        .agg(count("o.id").alias("pedidos")) \
        .orderBy("anio", "mes", "estado")

    return {
        "tendencias_consumo": tendencias_consumo,
        "horarios_pico": horarios_pico,
        "crecimiento_mensual": crecimiento_mensual,
        "olap_ingresos_mes_categoria": olap_ingresos_mes_categoria,
        "olap_ingresos_categoria": olap_ingresos_categoria,
        "olap_actividad_geografica": olap_actividad_geografica,
        "olap_pedidos_estado": olap_pedidos_estado,
        "olap_pedidos_mes_estado": olap_pedidos_mes_estado,
    }


def main():
    # Habilitamos soporte para Hive apuntando al metastore externo (sin esto
    # Spark crearia un metastore local temporal y los datos se perderian).
    spark = SparkSession.builder \
        .appName("Restaurante_ETL") \
        .enableHiveSupport() \
        .config("hive.metastore.uris", "thrift://hive-metastore:9083") \
        .config("spark.sql.warehouse.dir", "hdfs://namenode:9000/user/hive/warehouse") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")

    db_type = os.environ.get("DB_TYPE", "postgres").lower()

    print("=========================================")
    print(f" Iniciando ETL (fuente de datos: {db_type})")
    print("=========================================")

    # === 1. EXTRACCION (segun la fuente configurada) ===
    try:
        d = extraer_mongo(spark) if db_type == "mongo" else extraer_postgres(spark)
        print(f"Datos extraidos de {db_type} correctamente.")
    except Exception as e:
        print(f"Error extrayendo datos de {db_type}: {e}")
        print("Verifica que la fuente este disponible y tenga datos.")
        spark.stop()
        return

    # === 2. TRANSFORMACION (identica para ambas fuentes) ===
    print("Transformando datos: esquema estrella + cubos OLAP...")
    try:
        dimensiones = construir_dimensiones(d)
        df_lineas = construir_lineas(d).cache()
        fact = construir_hechos(df_lineas)
        cubos = construir_olap(spark, d, df_lineas)
        print(f"Transformaciones listas. Lineas de detalle: {df_lineas.count()}")
    except Exception as e:
        print(f"Error en transformacion: {e}")
        print("Revisa que los nombres de columna coincidan con los de la fuente.")
        spark.stop()
        return

    # === 3. CARGA EN HIVE ===
    # El ETL RECONSTRUYE el warehouse en cada corrida (idempotente). Por eso, antes
    # de escribir, dejamos cada base totalmente limpia: borramos su entrada del
    # metastore (DROP ... CASCADE) y tambien su carpeta en HDFS. Esto evita el error
    # LOCATION_ALREADY_EXISTS, que ocurre cuando queda un directorio huerfano de una
    # corrida previa (tipico al resetear el metastore sin borrar el volumen de HDFS,
    # o al cambiar el set de tablas que produce el ETL).
    warehouse = "hdfs://namenode:9000/user/hive/warehouse"

    def borrar_ruta_hdfs(ruta):
        conf = spark._jsc.hadoopConfiguration()
        p = spark._jvm.org.apache.hadoop.fs.Path(ruta)
        fs = p.getFileSystem(conf)
        if fs.exists(p):
            fs.delete(p, True)  # recursivo

    def preparar_db(db):
        try:
            spark.sql(f"DROP DATABASE IF EXISTS {db} CASCADE")
        except Exception as e:
            print(f"   (aviso) no se pudo limpiar {db} en el metastore: {e}")
        borrar_ruta_hdfs(f"{warehouse}/{db}.db")  # barre directorios huerfanos
        spark.sql(f"CREATE DATABASE {db}")

    def guardar(df, tabla):
        df.write.mode("overwrite").saveAsTable(tabla)
        print(f"   -> {tabla}")

    try:
        # 3a. Esquema estrella (modelo dimensional) -> restaurante_dw
        print("Cargando ESQUEMA ESTRELLA en restaurante_dw...")
        preparar_db("restaurante_dw")
        for nombre, df in dimensiones.items():
            guardar(df, f"restaurante_dw.{nombre}")
        guardar(fact, "restaurante_dw.fact_detalle_ordenes")

        # 3b. Cubos / vistas OLAP (para dashboards) -> restaurante_olap
        print("Cargando CUBOS OLAP en restaurante_olap...")
        preparar_db("restaurante_olap")
        for nombre, df in cubos.items():
            guardar(df, f"restaurante_olap.{nombre}")

        print("=========================================")
        print(" ETL completado exitosamente!")
        print(f" Esquema estrella: {len(dimensiones)} dimensiones + 1 hechos")
        print(f" Cubos OLAP: {len(cubos)} tablas pre-agregadas")
        print("=========================================")
    except Exception as e:
        print(f"Error guardando en Hive: {e}")
        print("Estan corriendo los servicios namenode, datanode y hive-metastore?")

    spark.stop()


if __name__ == "__main__":
    main()
