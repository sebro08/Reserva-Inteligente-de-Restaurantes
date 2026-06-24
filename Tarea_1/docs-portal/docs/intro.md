---
id: intro
title: Overview
sidebar_label: Overview
sidebar_position: 1
slug: /
---

# API de Reserva Inteligente de Restaurantes

Bienvenido al portal de desarrolladores de **Reserva Inteligente**, una plataforma
distribuida para gestionar restaurantes, menús, pedidos y reservas, con una capa
analítica de **Data Warehouse**, **grafos** y **rutas de entrega** por encima.

Esta documentación está pensada para que puedas integrarte con la API en minutos:
empezá por el [Quickstart](/quickstart), entendé el [modelo de autenticación](/autenticacion)
y luego explorá cada endpoint en la [Referencia API](/reference/).

<div class="portal-cards">
  <a class="portal-card" href="/quickstart">
    <svg class="portal-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    <h3>Quickstart</h3>
    <p>Registrate, obtené un token y hacé tu primera llamada autenticada en 3 pasos.</p>
  </a>
  <a class="portal-card" href="/autenticacion">
    <svg class="portal-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    <h3>Autenticación</h3>
    <p>Login vía Keycloak y uso del token JWT como <code>Bearer</code>.</p>
  </a>
  <a class="portal-card" href="/reference/">
    <svg class="portal-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
    <h3>Referencia API</h3>
    <p>Todos los endpoints, parámetros, esquemas y ejemplos (generado desde OpenAPI).</p>
  </a>
  <a class="portal-card" href="/conceptos">
    <svg class="portal-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
    <h3>Conceptos</h3>
    <p>El modelo de dominio y la capa analítica (DW/OLAP, Neo4j, rutas).</p>
  </a>
</div>

## URL base

Todas las rutas se sirven detrás del balanceador **Nginx** bajo el prefijo `/api`:

```
http://localhost/api
```

Por ejemplo, el login es `POST http://localhost/api/auth/login`. En la
[Referencia API](/reference/) las rutas se muestran relativas a esa base.

## Convenciones

| Aspecto | Detalle |
| --- | --- |
| **Formato** | Todas las peticiones y respuestas usan `application/json`. |
| **Autenticación** | JWT vía Keycloak. Se envía en el header `Authorization: Bearer <token>`. Ver [Autenticación](/autenticacion). |
| **Errores** | Cuerpo JSON con un campo `message`. Códigos HTTP estándar. Ver [Modelo de errores](/errores). |
| **Zona horaria** | Las fechas se manejan en formato ISO 8601 (`yyyy-MM-dd`). |

## ¿Qué incluye la plataforma?

La API combina un **núcleo transaccional** (CRUD de usuarios, restaurantes, menús,
pedidos y reservas) con una **capa de análisis de datos**:

- **Data Warehouse / OLAP** — un esquema estrella y cubos pre-agregados en Apache
  Hive, alimentados por un ETL de Apache Spark.
- **Grafo (Neo4j)** — relaciones entre usuarios, productos y pedidos para detectar
  co-compras, usuarios influyentes y caminos óptimos de reparto.
- **Rutas de entrega** — asignación de pedidos a repartidores con heurística de
  vecino más cercano y caminos mínimos (Dijkstra).

Los endpoints de análisis viven bajo el tag **Graph** en la
[Referencia API](/reference/). Para entender cómo encaja todo, leé
[Conceptos](/conceptos).
