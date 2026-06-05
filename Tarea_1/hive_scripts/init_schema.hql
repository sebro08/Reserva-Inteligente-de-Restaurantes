-- Creación de Base de Datos
CREATE DATABASE IF NOT EXISTS restaurante_dw;
USE restaurante_dw;

-- Dimensión Tiempo
CREATE TABLE IF NOT EXISTS Dim_Tiempo (
    id_tiempo INT,
    fecha_completa DATE,
    dia INT,
    mes INT,
    anio INT,
    nombre_dia STRING,
    es_fin_de_semana BOOLEAN
)
STORED AS PARQUET;

-- Dimensión Usuario
CREATE TABLE IF NOT EXISTS Dim_Usuario (
    id_usuario INT,
    fecha_registro DATE,
    rol STRING,
    estado_activo BOOLEAN
)
STORED AS PARQUET;

-- Dimensión Producto
CREATE TABLE IF NOT EXISTS Dim_Producto (
    id_producto INT,
    nombre_producto STRING,
    categoria_producto STRING,
    nombre_menu STRING
)
STORED AS PARQUET;

-- Dimensión Ubicación
CREATE TABLE IF NOT EXISTS Dim_Ubicacion (
    id_ubicacion INT,
    detalle STRING,
    distrito STRING,
    canton STRING,
    provincia STRING,
    pais STRING,
    latitud DOUBLE,
    longitud DOUBLE
)
STORED AS PARQUET;

-- Dimensión Restaurante
CREATE TABLE IF NOT EXISTS Dim_Restaurante (
    id_restaurante INT,
    nombre_restaurante STRING
)
STORED AS PARQUET;

-- Tabla de Hechos
CREATE TABLE IF NOT EXISTS Fact_Detalle_Ordenes (
    id_tiempo INT,
    id_usuario INT,
    id_producto INT,
    id_ubicacion INT,
    id_restaurante INT,
    cantidad_comprada INT,
    precio_unitario_historico DOUBLE,
    monto_total_linea DOUBLE,
    estado_pedido STRING,
    es_pickup BOOLEAN
)
STORED AS PARQUET;
