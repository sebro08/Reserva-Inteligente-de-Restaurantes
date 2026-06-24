---
id: autenticacion
title: Autenticación
sidebar_label: Autenticación
sidebar_position: 3
---

# Autenticación

La API usa **JWT (JSON Web Tokens)** emitidos por **Keycloak** como servidor de
identidad. El flujo es sencillo: te registrás, hacés login para obtener un token y
lo enviás en cada petición protegida mediante el header `Authorization`.

## Esquema de seguridad

| Campo | Valor |
| --- | --- |
| Tipo | `http` |
| Esquema | `bearer` |
| Formato del token | `JWT` |
| Header | `Authorization: Bearer <access_token>` |

Salvo las rutas públicas, **todos los endpoints requieren un token válido**. En la
[Referencia API](/reference/) las operaciones protegidas aparecen marcadas con un
candado.

## Rutas públicas

Estas dos no requieren token (son la puerta de entrada):

- `POST /auth/register` — crear una cuenta.
- `POST /auth/login` — obtener un token.

## Obtener un token

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "juan@correo.com", "password": "pass123" }'
```

La respuesta incluye:

| Campo | Descripción |
| --- | --- |
| `access_token` | El JWT que se envía en cada petición. |
| `refresh_token` | Permite renovar el `access_token` cuando expira. |
| `expires_in` | Segundos de validez del `access_token` (por defecto `3600` = 1 hora). |

## Usar el token

Incluí el `access_token` en el header `Authorization` con el prefijo `Bearer`:

```bash
curl http://localhost/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
```

## Roles

El rol se asigna en el registro mediante `role_name` y condiciona qué operaciones
puede realizar la cuenta:

| Rol | Pensado para |
| --- | --- |
| `cliente_restaurante` | Usuarios finales: crear pedidos y reservas. |
| `admin_restaurante` | Administradores: gestionar restaurantes, menús y platos. |

## Expiración y renovación

Cuando el `access_token` expira, las peticiones devuelven `401 Unauthorized`. En ese
caso volvé a autenticarte (o usá el `refresh_token`, si tu integración lo soporta)
para obtener un token nuevo. Ver [Modelo de errores](/errores) para el detalle de
las respuestas `401` y `403`.

:::warning Nunca expongas tus tokens
El `access_token` da acceso a la cuenta. No lo incluyas en repositorios, logs ni en
el frontend de forma persistente. Trátalo como una credencial.
:::
