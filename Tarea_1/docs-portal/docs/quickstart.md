---
id: quickstart
title: Quickstart
sidebar_label: Quickstart
sidebar_position: 2
---

# Quickstart

Esta guía muestra **cómo funciona** el flujo típico de la API —registrar un usuario,
obtener un token y hacer una llamada autenticada—. Es material de referencia: los
ejemplos usan `curl`, pero podés reproducirlos con cualquier cliente (por ejemplo
Postman) contra una instancia de la plataforma en ejecución.

La URL base es `http://localhost/api` (ver [Overview](/)). Si todavía no tenés la
plataforma levantada, la guía igual te sirve para entender el flujo antes de integrarte.

## 1. Registrar un usuario

El registro crea la cuenta en Keycloak y en la base de datos. El campo `role_name`
define el tipo de cuenta (`cliente_restaurante` o `admin_restaurante`).

```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@correo.com",
    "password": "pass123",
    "role_name": "cliente_restaurante"
  }'
```

## 2. Iniciar sesión y obtener el token

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@correo.com",
    "password": "pass123"
  }'
```

Respuesta:

```json
{
  "message": "Login exitoso",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "expires_in": 3600
}
```

Guardá el `access_token`: es el que vas a mandar en cada petición protegida.

```bash
export TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6..."
```

## 3. Hacer una llamada autenticada

Pasá el token en el header `Authorization`. Por ejemplo, los **5 productos más
comprados juntos** (análisis de grafo):

```bash
curl http://localhost/api/graph/top-products \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta:

```json
{
  "success": true,
  "count": 5,
  "data": [
    { "product1": "Casado", "product2": "Refresco natural", "times": 18 },
    { "product1": "Gallo pinto", "product2": "Café", "times": 15 }
  ]
}
```

:::tip ¿Y ahora qué?
- Mirá cómo funciona el token en detalle en [Autenticación](/autenticacion).
- Si recibís un `401` o `403`, revisá el [Modelo de errores](/errores).
- Explorá todos los endpoints disponibles en la [Referencia API](/reference/).
:::
