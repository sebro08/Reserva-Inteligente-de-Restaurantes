---
id: conceptos
title: Conceptos de la plataforma
sidebar_label: Conceptos
sidebar_position: 5
---

# Conceptos de la plataforma

La API expone dos capas que conviene entender antes de integrarse: el **núcleo
transaccional** (los datos del día a día) y la **capa analítica** (lo que se
construye sobre esos datos).

## Modelo de dominio

El núcleo transaccional gira alrededor de estas entidades:

| Entidad | Descripción |
| --- | --- |
| **User** | Persona registrada. Tiene un rol (`cliente_restaurante` / `admin_restaurante`). |
| **Restaurant** | Restaurante administrado por un usuario; tiene una ubicación. |
| **Menu** | Conjunto de platos de un restaurante. |
| **Plate** | Producto individual (nombre, categoría, precio) dentro de un menú. |
| **Order** | Pedido de un usuario a un restaurante; agrupa varias líneas (platos + cantidad). |
| **Reservation** | Reserva de mesa: fecha, hora y cantidad de personas. |
| **Location** | Ubicación geográfica (con latitud/longitud) de restaurantes y entregas. |

Relaciones principales: un `User` realiza muchas `Order` y `Reservation`; un
`Restaurant` tiene un `Menu` con varios `Plate`; cada `Order` referencia un
`Restaurant`, una `Location` de entrega y un conjunto de platos.

## Capa analítica

Sobre los datos transaccionales se construyen tres subsistemas. Sus resultados se
consultan, principalmente, bajo el tag **Graph** de la [Referencia API](/reference/).

### 1. Data Warehouse y OLAP

Un ETL de **Apache Spark** lee la base transaccional (PostgreSQL o MongoDB) y la
transforma en un **esquema estrella** sobre **Apache Hive**:

- **Dimensiones:** `dim_tiempo`, `dim_usuario`, `dim_producto`, `dim_ubicacion`,
  `dim_restaurante`.
- **Tabla de hechos:** `fact_detalle_ordenes` (una fila por línea de pedido, con
  cantidad, precio histórico y monto total).

Además se materializan **cubos OLAP** pre-agregados (ingresos por mes y categoría,
actividad por zona, pedidos por estado, tendencias de consumo, horarios pico,
crecimiento mensual) que alimentan los dashboards de Metabase.

### 2. Grafo de relaciones (Neo4j)

Los pedidos se modelan como un grafo `(:User)-[:PLACED]->(:Order)-[:CONTAINS]->(:Plate)`
para responder preguntas que en SQL serían costosas:

| Endpoint | Pregunta que responde |
| --- | --- |
| `GET /graph/top-products` | Los 5 pares de productos más comprados juntos (co-compra). |
| `GET /graph/recommending-users` | Usuarios influyentes que "recomiendan" a otros por afinidad de pedidos. |

### 3. Rutas de entrega

Las `Location` forman una red geográfica con relaciones de distancia (`km`) y tiempo
(`minutes`). Sobre ella se calculan rutas óptimas:

| Endpoint | Qué hace |
| --- | --- |
| `GET /graph/shortest-path` | Camino mínimo entre dos ubicaciones (Dijkstra ponderado por km). |
| `GET /graph/delivery-routes` | Asigna los pedidos de un restaurante a repartidores con heurística de vecino más cercano. |

## Cómo encaja con la API

El cliente trabaja casi siempre contra el **núcleo transaccional** (crear pedidos,
reservas, gestionar menús). La **capa analítica** se consume de solo lectura a través
de los endpoints de **Graph** y de los dashboards de visualización. El pipeline que
mantiene el Data Warehouse al día se orquesta con **Apache Airflow** y corre de forma
programada, de modo que los datos analíticos reflejan la actividad transaccional sin
que el cliente tenga que hacer nada.

:::info Para profundizar
La documentación técnica completa del flujo de datos (ETL, DAG de Airflow, cubos
OLAP y consultas Cypher) vive en el PDF de diseño del proyecto. Este portal cubre la
**superficie de la API**; los endpoints concretos están en la [Referencia API](/reference/).
:::
