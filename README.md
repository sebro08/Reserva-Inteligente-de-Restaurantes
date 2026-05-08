# Reserva Inteligente de Restaurantes - API REST

API REST para la gestión de reservas en restaurantes, implementando autenticación (Keycloak), búsqueda rápida (Elasticsearch), caché (Redis), contenedorización avanzada (Docker/Docker Compose), orquestación (Kubernetes) y soporte multimotor dinámico (PostgreSQL y MongoDB Sharded).

## Tecnologías Utilizadas
- **Backend:** Node.js, Express.js, TypeScript.
- **Bases de Datos:** PostgreSQL (Relacional) y MongoDB Sharded (NoSQL).
- **Caché y Búsqueda:** Redis, Elasticsearch.
- **Autenticación:** Keycloak (OAuth2 / JWT).
- **Infraestructura:** Docker, Docker Compose, Kubernetes, Nginx (Balanceador de carga).

---

## Requisitos Previos
- **Docker y Docker Compose** instalados.
- **Node.js** (Opcional, para desarrollo local).
- **Minikube / Docker Desktop** (Con soporte para Kubernetes habilitado si deseas probar la orquestación).
- Puertos libres en tu red local: `80` (Nginx/API), `3001` (Search), `8080` (Keycloak), `5432` (Postgres), `27017` (Mongo).

---

## Configuración Inicial
1. Entra al directorio de trabajo asociado:
   ```bash
   git clone https://github.com/sebro08/Reserva-Inteligente-de-Restaurantes.git
   cd Reserva-Inteligente-de-Restaurantes/Tarea_1
   ```
2. Crea el archivo de variables de entorno:
   Renombra o copia el archivo `.env.example` a `.env` y ajusta las variables según sea necesario:
   ```bash
   cp .env.example .env
   ```

---

## Ejecución del Proyecto (Docker Compose)

El sistema permite cambiar dinámicamente de motor de base de datos sin modificar el código fuente gracias a la abstracción de repositorios y la inyección por `RepositoryFactory`.

### Opción 1: Ejecución con PostgreSQL (Más ligero)
Este es el modo más rápido y ligero para levantar el proyecto de forma local.

1. Asegúrate de que en tu archivo `.env` tengas definida la siguiente variable:
   `DB_TYPE=postgres`
2. Construye y levanta los servicios:
   ```bash
   docker-compose up -d --build
   ```
3. **Poblar la Base de Datos:**
   PostgreSQL inicia vacío. Para inyectar los datos semilla (menús, ubicaciones, etc.), ejecuta el script de Powershell incluido *después* de confirmar que la base de datos corre correctamente:
   ```bash
   .\seed.ps1
   ```

### Opción 2: Ejecución con MongoDB (Entorno con Sharding)
Este entorno cumple con requerimientos de alta disponibilidad (levanta los ConfigServers, Routers y ReplicaSets). Requiere más recursos del sistema.

1. En tu archivo `.env`, cambia el motor de base de datos:
   `DB_TYPE=mongodb` (o `mongo` según su configuración base).
2. Levanta los contenedores usando el profile específico que habilita la estructura distribuida de Mongo:
   ```bash
   docker-compose --profile mongo up -d --build
   ```
3. **Inicialización Automática y Poblado:**
   El despliegue global de MongoDB tomará algunos minutos en inicializarse. **No es necesario ejecutar `seed.ps1`**. El contenedor `mongoinit` se encarga de habilitar el sharding, configurar los índices y volcar los datos iniciales.
   Puedes monitorear este estado con: 
   ```bash
   docker logs -f mongoinit
   ```

---

## Orquestación con Kubernetes (Opcional)

Si deseas probar la alta escalabilidad y el balanceo de carga nativo usando Kubernetes:

1. **Ajuste de Código (Middlewares):**
   Edita el archivo `backend/src/middleware/keycloak.ts`. 
   - Comenta el bloque general habilitado para `[DOCKER COMPOSE]`.
   - Descomenta el bloque identificado como `[KUBERNETES]` (para adaptar URLs como `keycloak-svc`).
2. **Construir Imágenes Locales:**
   Crea previamente en tu máquina las imágenes de contenedor que demanda Kubernetes:
   ```bash
   docker build -t api-img:latest .
   docker build -t search-service-img:latest ./search-service
   ```
3. **Aplicar los Manifiestos de Cluster:**
   ```bash
   kubectl apply -f k8s-demo.yaml
   ```
   *(Si deseas levantar el MongoDB dentro de K8s, edita el `ConfigMap` en `k8s-demo.yaml`, cambia el entorno a `DB_TYPE: "mongo"` y aplica también el manifiesto con la base de datos `kubectl apply -f k8s-mongo.yaml`).*

---

## Pruebas, Roles y Monitoreo

- **Documentación de la Interfaz REST (Swagger):** Accesible desde `http://localhost/api/api-docs` una vez levantada.
- **Keycloak (Control de Accesos):** Se accede desde `http://localhost:8080`.
- **Limpieza de Entorno:**
  Para detener todo de forma limpia y eliminar los volúmenes, puedes ejecutar:
  ```bash
  docker-compose --profile mongo down -v
  ```
