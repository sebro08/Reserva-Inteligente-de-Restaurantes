import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum, hour, month, year, desc

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
    # Nota: Si cambias DB_TYPE a mongo, puedes usar esta función para leer en lugar de get_postgres_df
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://mongos1:27017,mongos2:27017")
    mongo_db = os.environ.get("MONGO_DB_NAME", "restaurant_db")
    
    return spark.read \
        .format("mongodb") \
        .option("spark.mongodb.read.connection.uri", f"{mongo_uri}/{mongo_db}.{collection_name}") \
        .load()

def main():
    # Inicializar Spark Session
    # Habilitamos soporte para Hive para que los resultados puedan ser consultados por Superset
    spark = SparkSession.builder \
        .appName("Restaurante_ETL") \
        .enableHiveSupport() \
        .getOrCreate()
    
    spark.sparkContext.setLogLevel("WARN")
    
    print("=========================================")
    print(" Iniciando extracción de datos...")
    print("=========================================")
    
    # === 1. EXTRACCIÓN ===
    try:
        df_users = get_postgres_df(spark, "user")
        df_orders = get_postgres_df(spark, "order")
        # En la base de datos, el detalle de la orden une producto (plate) con orden
        df_order_items = get_postgres_df(spark, "order_item") 
        df_plates = get_postgres_df(spark, "plate")
        print("Datos extraídos de PostgreSQL correctamente.")
    except Exception as e:
        print(f"Error extrayendo datos de Postgres: {e}")
        print("Asegúrate de que las tablas existan. Si usas MongoDB, cambia el script para usar get_mongo_df().")
        spark.stop()
        return

    # === 2. TRANSFORMACIÓN ===
    print("Transformando datos para análisis OLAP...")
    
    try:
        # Detectamos nombres de columnas de relaciones (TypeORM puede usar camelCase o snake_case)
        order_col = "orderId" if "orderId" in df_order_items.columns else "order_id"
        plate_col = "plateId" if "plateId" in df_order_items.columns else "plate_id"
        
        # Unimos las tablas (Inner Join)
        df_fact = df_orders.join(df_order_items, df_orders["id"] == df_order_items[order_col], "inner") \
                           .join(df_plates, df_order_items[plate_col] == df_plates["id"], "inner")
                           
        # Análisis 1: Tendencias de consumo (Top 10 productos más vendidos)
        tendencias_df = df_fact.groupBy(df_plates["name"].alias("producto"), df_plates["category_id"]) \
            .agg(sum(df_order_items["quantity"]).alias("cantidad_vendida"), sum(df_plates["price"] * df_order_items["quantity"]).alias("ingreso_total")) \
            .orderBy(desc("cantidad_vendida")) \
            .limit(10)
            
        # Análisis 2: Horarios pico (Agrupar por hora de la orden)
        horarios_pico_df = df_orders.withColumn("hora", hour("created_at")) \
            .groupBy("hora") \
            .agg(count(df_orders["id"]).alias("total_pedidos")) \
            .orderBy(desc("total_pedidos"))
            
        # Análisis 3: Crecimiento Mensual (Agrupar por Año y Mes)
        crecimiento_mensual_df = df_orders.withColumn("anio", year("created_at")) \
            .withColumn("mes", month("created_at")) \
            .groupBy("anio", "mes") \
            .agg(count(df_orders["id"]).alias("total_pedidos")) \
            .orderBy("anio", "mes")

        print("Transformaciones calculadas exitosamente.")

    except Exception as e:
        print(f"Error en transformación: {e}")
        print("Asegúrate de que los nombres de las columnas coincidan con los de tu BD.")
        spark.stop()
        return

    # === 3. CARGA (Guardar en Hive) ===
    print("Guardando resultados en Apache Hive...")
    spark.sql("CREATE DATABASE IF NOT EXISTS restaurante_olap")
    
    try:
        # Guardamos en formato parquet como tablas manejadas por Hive
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
