---
id: errores
title: Modelo de errores
sidebar_label: Modelo de errores
sidebar_position: 4
---

# Modelo de errores

La API usa **códigos de estado HTTP estándar** y, ante un error, devuelve un cuerpo
JSON con un campo `message` descriptivo.

## Forma de un error

```json
{
  "message": "Error interno del servidor"
}
```

Los endpoints de análisis (tag **Graph**) usan una variante con `success: false`
para que el cliente distinga fácilmente el resultado:

```json
{
  "success": false,
  "message": "Debe proporcionar los query params 'from' y 'to' (ids de Location)"
}
```

## Códigos de estado

| Código | Significado | Cuándo ocurre |
| --- | --- | --- |
| `200 OK` | Éxito | La petición se procesó correctamente. |
| `400 Bad Request` | Petición inválida | Faltan campos o parámetros obligatorios (p. ej. `from`/`to` en `shortest-path`). |
| `401 Unauthorized` | No autenticado | Falta el token, está vencido o es inválido. Ver [Autenticación](/autenticacion). |
| `403 Forbidden` | Sin permisos | El token es válido pero el rol no puede realizar la operación. |
| `404 Not Found` | No encontrado | El recurso solicitado no existe (p. ej. un restaurante sin ubicación). |
| `500 Internal Server Error` | Error del servidor | Falla inesperada al procesar la petición. |

## Ejemplos por código

**400 — falta un parámetro**

```json
{ "success": false, "message": "Debe proporcionar el query param 'restaurantId'" }
```

**401 — token ausente o vencido**

```json
{ "message": "No autorizado" }
```

**404 — recurso inexistente**

```json
{ "success": false, "message": "No se encontró un camino entre esas ubicaciones" }
```

## Buenas prácticas para el cliente

- Verificá siempre el **código HTTP** antes de leer el cuerpo.
- Para los endpoints de **Graph**, ramificá según el booleano `success`.
- Ante un `401`, renová el token y reintentá; no reintentes en bucle un `400`/`403`
  (el problema está en la petición, no en el servidor).
