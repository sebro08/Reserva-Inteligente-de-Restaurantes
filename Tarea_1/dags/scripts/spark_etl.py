import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum, hour, month, year, desc, explode

# =============================================================================
# ETL del Restaurante
# Funciona con DOS fuentes de datos segun la variable de entorno DB_TYPE:
#   - postgres (por defecto): lee las tablas relacionales order/order_item/plate
#   - mongo: lee las colecciones de MongoDB (orders con items embebidos, plate)
# En ambos casos normaliza los datos a tres DataFrames estandar
# (df_orders, df_order_items, df_plates) y aplica las mismas transformaciones.
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


def extraer_postgres(spark):
    """Lee de PostgreSQL y normaliza a (df_orders, df_order_items, df_plates)."""
    df_orders_raw = get_postgres_df(spark, "order")
    df_items_raw = get_postgres_df(spark, "order_item")
    df_plates_raw = get_postgres_df(spark, "plate")

    # TypeORM puede usar camelCase o snake_case para las FKs
    order_col = "orderId" if "orderId" in df_items_raw.columns else "order_id"
    plate_col = "plateId" if "plateId" in df_items_raw.columns else "plate_id"

    df_orders = df_orders_raw.select(col("id"), col("created_at"))
    df_order_items = df_items_raw.select(
        col(order_col).alias("order_id"),
        col(plate_col).alias("plate_id"),
        col("quantity"),
    )
    df_plates = df_plates_raw.select(
        col("id"), col("name"), col("category_id"), col("price")
    )
    return df_orders, df_order_items, df_plates


def extraer_mongo(spark):
    """Lee de MongoDB y normaliza a (df_orders, df_order_items, df_plates).

    En Mongo las ordenes EMBEBEN sus items en un arreglo 'items', por lo que
    usamos explode() para desanidarlos y obtener el equivalente a order_item.
    """
    df_orders_raw = get_mongo_df(spark, "orders")
    df_plates_raw = get_mongo_df(spark, "plate")

    df_orders = df_orders_raw.select(col("id"), col("created_at"))

    # Desanidar el arreglo items -> una fila por (orden, plato)
    df_order_items = df_orders_raw \
        .select(col("id").alias("order_id"), explode(col("items")).alias("item")) \
        .select(
            col("order_id"),
            col("item.plate_id").alias("plate_id"),
            col("item.quantity").alias("quantity"),
        )

    df_plates = df_plates_raw.select(
        col("id"), col("name"), col("category_id"), col("price")
    )
    return df_orders, df_order_items, df_plates


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

    # === 1. EXTRACCIÓN (segun la fuente configurada) ===
    try:
        if db_type == "mongo":
            df_orders, df_order_items, df_plates = extraer_mongo(spark)
        else:
            df_orders, df_order_items, df_plates = extraer_postgres(spark)
        print(f"Datos extraídos de {db_type} correctamente.")
    except Exception as e:
        print(f"Error extrayendo datos de {db_type}: {e}")
        print("Verifica que la fuente esté disponible y tenga datos.")
        spark.stop()
        return

    # === 2. TRANSFORMACIÓN (igual para ambas fuentes) ===
    print("Transformando datos para análisis OLAP...")

    try:
        # Tabla de hechos: une items con platos (precio, nombre, categoría)
        df_fact = df_order_items.join(
            df_plates, df_order_items["plate_id"] == df_plates["id"], "inner"
        ).select(
            df_plates["name"].alias("producto"),
            df_plates["category_id"].alias("category_id"),
            df_order_items["quantity"].alias("quantity"),
            (df_plates["price"] * df_order_items["quantity"]).alias("monto_linea"),
        )

        # Análisis 1: Tendencias de consumo (Top 10 productos más vendidos)
        tendencias_df = df_fact.groupBy("producto", "category_id") \
            .agg(
                sum("quantity").alias("cantidad_vendida"),
                sum("monto_linea").alias("ingreso_total"),
            ) \
            .orderBy(desc("cantidad_vendida")) \
            .limit(10)

        # Análisis 2: Horarios pico (agrupar por hora de la orden)
        horarios_pico_df = df_orders.withColumn("hora", hour("created_at")) \
            .groupBy("hora") \
            .agg(count("id").alias("total_pedidos")) \
            .orderBy(desc("total_pedidos"))

        # Análisis 3: Crecimiento mensual (agrupar por año y mes)
        crecimiento_mensual_df = df_orders.withColumn("anio", year("created_at")) \
            .withColumn("mes", month("created_at")) \
            .groupBy("anio", "mes") \
            .agg(count("id").alias("total_pedidos")) \
            .orderBy("anio", "mes")

        print("Transformaciones calculadas exitosamente.")

    except Exception as e:
        print(f"Error en transformación: {e}")
        print("Asegúrate de que los nombres de las columnas coincidan con los de tu fuente.")
        spark.stop()
        return

    # === 3. CARGA (Guardar en Hive) ===
    print("Guardando resultados en Apache Hive...")
    spark.sql("CREATE DATABASE IF NOT EXISTS restaurante_olap")

    try:
        tendencias_df.write.mode("overwrite").saveAsTable("restaurante_olap.tendencias_consumo")
        horarios_pico_df.write.mode("overwrite").saveAsTable("restaurante_olap.horarios_pico")
        crecimiento_mensual_df.write.mode("overwrite").saveAsTable("restaurante_olap.crecimiento_mensual")

        print("=========================================")
        print(" ¡ETL completado exitosamente! ")
        print(" Las tablas fueron guardadas en Hive: ")
        print(" - restaurante_olap.tendencias_consumo")
        print(" - restaurante_olap.horarios_pico")
        print(" - restaurante_olap.crecimiento_mensual")
        print("=========================================")
    except Exception as e:
        print(f"Error guardando en Hive: {e}")
        print("¿Están corriendo los servicios namenode, datanode y hive-metastore?")

    spark.stop()


if __name__ == "__main__":
    main()
