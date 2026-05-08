README.md

1. Ejecución del proyecto

1.2 Requisitos
    Docker
    Docker Compose
    Node.js (opcional para desarrollo local)

1.3 Instalación
    git clone sebro08/Reserva-Inteligente-de-Restaurantes: Tarea programada, de una API REST para la gestión de reservas en restaurantes, implementando autenticación con JWT, contenedorización con Docker y pruebas unitarias. 

    cd Tarea_1

1.4 Ejecución
    docker-compose up --build
    docker-compose --profile mongo up -d --build

2 Cambio de motor de base de datos
El sistema soporta múltiples motores mediante configuración.
Variable clave, dependiendo del tipo de base de datos que se quiera:
    DB_TYPE=postgres
    DB_TYPE=mongodb

Para poder permitir cambiar el motor sin modificar código, se utiliza:
    RepositoryFactory
    Abstracción de repositorios.

3. Variables de entorno
Las variables principales son:
    DB_HOST
    DB_PORT
    DB_USERNAME
    DB_PASSWORD
    DB_TYPE
    NODE_ENV
    SESSION_SECRET

4. Scripts principales
    npm install
    npm test
    npm run build
    npm run test:integration
    docker-compose up
    docker-compose --profile mongo up -d --build
