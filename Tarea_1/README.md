# Reserva Inteligente de Restaurantes - API REST

Esta es la primera entrega del proyecto "Reserva Inteligente de Restaurantes". Consiste en una API REST desarrollada con **Node.js, Express y TypeORM**, diseñada para la gestión de usuarios, autenticación y reservas de mesas. Todo el entorno está contenedorizado y orquestado mediante Docker.

## Tecnologías Utilizadas
- **Backend:** Node.js, Express.js, TypeScript.
- **Base de Datos:** PostgreSQL.
- **ORM:** TypeORM.
- **Autenticación:** Keycloak (JWT - JSON Web Tokens).
- **Contenedorización:** Docker, Docker Compose (Multi-stage build).
- **Documentación:** Swagger.
- **Pruebas:** Jest & Supertest.

## Requisitos Previos
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/) instalados.
- Archivo `.env` configurado en la raíz del proyecto (ver plantilla más abajo).

## Variables de Entorno (`.env`)
Asegúrate de contar con el archivo `.env` en la raíz de tu proyecto con las siguientes variables:

```env
# Configuración de la Base de Datos
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=restaurante_admin
DB_PASSWORD=123lol
DB_NAME=restaurante_db

# Configuración de Keycloak
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=restaurante-realm
KEYCLOAK_CLIENT_ID=restaurante-api
```

## Instrucciones de Ejecución

### 1. Levantar la Infraestructura
Para iniciar la base de datos, el servicio de autenticación (Keycloak) y la API, ejecuta en la terminal:

```bash
docker-compose up -d --build
```

### 2. Poblar la Base de Datos (Seeding)
Una vez que los contenedores estén corriendo y la API esté conectada, puedes insertar los datos base (catálogos de ubicaciones, roles y estados). Ejecuta el script de PowerShell incluido en la raíz:

```powershell
./seed.ps1
```

### 3. Documentación Swagger y Pruebas Unitarias
El proyecto cuenta con documentación interactiva provista por Swagger y cobertura de pruebas.
- **Swagger:** Una vez corriendo, revisa la documentación de los endpoints navegando a `http://localhost:3000/api-docs`. AJUSTAR RUTA***
- **Pruebas Unitarias:** Fueron desarrolladas con Jest. Se pueden correr localmente ejecutando:
  ```bash
  npm run test
  ```

## Resumen de Endpoints Principales

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **POST** | `/auth/register` | Registro de nuevo usuario. |
| **POST** | `/auth/login` | Inicio de sesión y obtención de JWT. |
| **GET** | `/users/me` | Obtener detalles del usuario autenticado. |
| **GET** | `/restaurants` | Listar restaurantes disponibles. |
| **POST** | `/restaurants` | Registrar un restaurante *(Solo Admins)*. |
| **POST** | `/menus` | Crear menú para un restaurante. |
| **POST** | `/reservations` | Crear una nueva reserva de mesa. |
| **POST** | `/orders` | Realizar un pedido. |

## Notas de Seguridad y Buenas Prácticas Implementadas
- **Puerto de Base de Datos Privado:** Por seguridad, la base de datos PostgreSQL no expone su puerto por defecto hacia el host, sino que es accedida exclusivamente de forma interna en la red de Docker por el contenedor de la API.
- **Multi-stage Dockerfile:** La imagen final del backend carece de archivos y dependencias de desarrollo (TypeScript, utilidades temporales), resultando en una imagen mucho más segura y ligera.
