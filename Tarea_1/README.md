# Reserva Inteligente de Restaurantes - API REST

Esta es nuestra primera entrega del proyecto **"Reserva Inteligente de Restaurantes"**. 

Esta es una API REST para manejar todo lo necesario en un sistema de reservas: registro de usuarios, autenticación segura y, por supuesto, la gestión de restaurantes, menús y reserva de mesas.

Para hacer todo esto, usamos **Node.js, Express y TypeORM**. Además, metemos toda la aplicación en contenedores usando **Docker**.

## Autores
- Sebastián Rodríguez Sánchez
- Gabriel Arguedas Solano

---

## Tecnologías que usamos
- **Backend:** Node.js, Express.js y TypeScript.
- **Base de Datos:** PostgreSQL.
- **ORM:** TypeORM (nos facilitó muchísimo el manejo de la base de datos).
- **Autenticación:** Keycloak (usamos JWT).
- **Contenedorización:** Docker y Docker Compose.
- **Documentación de la API:** Swagger.
- **Pruebas (Testing):** Jest y Supertest.

---

## ¿Cómo levantar el proyecto? (Requisitos Previos)
Para correr esto, solo necesitas tener instalados:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Variables de Entorno (`.env`)
Antes de encender los contenedores, crea un archivo llamado `.env` en la raíz del proyecto y pégale esto:

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

### 2. Levantar los contenedores
Abre tu terminal en la raíz del proyecto y ejecuta el siguiente comando. Esto descargará las imágenes y construirá la app. Puede tardar un poco la primera vez:

```bash
docker-compose up -d --build
```

### 3. Poblar la Base de Datos (Seeding)
Para que no tengas que probar el sistema en blanco, preparamos un script que inserta datos base como ubicaciones, roles de usuario y estados de los pedidos. Si estás en Windows, solo corre:

```powershell
./seed.ps1
```

---

## Documentación (Swagger)
En cuanto a la documentación, para que los endpoints sean más fácil probarlos, usamos **Swagger** para generar una interfaz interactiva donde se ve qué rutas existen, qué datos piden y qué responden.

**Para probarlo:** Una vez que el proyecto esté corriendo, simplemente abre tu navegador y entra a:
`http://localhost:3000/api-docs` *(Nota: asegúrate de que el puerto de la API sea el 3000)*. Podrás mandar peticiones de prueba directo desde la página sin necesitar Postman.

---

## Pruebas Automatizadas (Testing)
Para asegurarnos de que el código aguante y funcione bien, escribimos pruebas divididas en dos tipos. Para correrlas, tienes que estar dentro de la carpeta `/backend`:

### Pruebas Unitarias
Estas pruebas (*unit tests*) revisan partes específicas y aisladas del código, como los controladores, "simulando" la base de datos para ver que la lógica matemática o los condicionales estén correctos. Se hicieron con **Jest**.
* **Para correrlas:** `npm run test`

### Pruebas de Integración
Estas son más completas. Levantan toda la aplicación en un entorno de pruebas (usando SQLite en memoria pura para los test, gracias a un `data-source.test.ts` que armamos) y tiran peticiones HTTP reales a nuestros endpoints usando **Supertest**. Esto confirma que el flujo completo, desde la petición hasta el guardado en base de datos, fluya sin problemas o "choques".
* **Para correrlas:** `npm run test:integration`

*(Si quieres correr **ambas** al mismo tiempo, puedes usar `npm run test:all`)*.

---

## Resumen de los Endpoints Principales

Aquí tienes un vistazo rápido de lo más importante que hace la API:

| Método | Endpoint | ¿Para qué sirve? |
| :--- | :--- | :--- |
| **POST** | `/auth/register` | Para que un usuario nuevo se registre. |
| **POST** | `/auth/login` | Para iniciar sesión y que el sistema te devuelva un token (JWT). |
| **GET** | `/users/me` | Ver los datos de tu propio perfil estando logueado. |
| **GET** | `/restaurants` | Ver la lista de restaurantes disponibles. |
| **POST** | `/restaurants` | Registrar un restaurante nuevo *(solo si eres Admin)*. |
| **POST** | `/menus` | Ponerle un menú a un restaurante *(solo si eres Admin)*. |
| **POST** | `/reservations` | Para reservar una mesa. |
| **POST** | `/orders` | Para pedir algo del menú. |

---

## Datos extra y "Buenas Prácticas" que quisimos añadir
* **Multi-stage build en Dockerfile:** Metimos la creación de la imagen del backend en un proceso de varias etapas. Al final, la imagen que corre no tiene archivos "basura" de desarrollo ni todo el código fuente original de TypeScript, así queda mucho más ligera y segura para "producción". En nuestro caso también lo hicimos ya que como la imagen es más ligera, es una ayuda para probarlo en nuestras computadoras sin que dure tanto cada vez que volvermos a inicar los contenedores.
* **Seguridad en la DB:** Por seguridad, la base de datos PostgreSQL no expone su puerto real hacia la máquina host obligatoriamente. Solamente la API puede hablar directo con la base de datos. Además toda la información importante de la base de datos se pasa mediante variables de entorno.
* **Pineado de versiones:** Todas las versiones utilizadas están definidas y pineadas en el docker-compose/dockerfile. Usamos mayormente versiones "alpine" para priorizar la ligereza de las imágenes.