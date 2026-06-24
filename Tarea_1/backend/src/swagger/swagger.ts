import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Reserva Inteligente de Restaurantes API",
      version: "1.0.0",
      description:
        "Documentación oficial de la API para la plataforma distribuida de gestión de restaurantes",
    },

    servers: [
      {
        url: "http://localhost/api",
        description: "Servidor Nginx (local)",
      },
      // Agrega aquí tu server de staging/producción cuando lo tengas, ej:
      // {
      //   url: "https://api.tu-dominio.com/api",
      //   description: "Servidor de producción",
      // },
    ],

    // Define el orden y la descripción de cada grupo en Swagger UI
    tags: [
      { name: "Auth", description: "Registro e inicio de sesión" },
      { name: "Users", description: "Gestión de usuarios" },
      { name: "Restaurants", description: "Gestión de restaurantes" },
      { name: "Menus", description: "Gestión de menús" },
      { name: "Orders", description: "Pedidos" },
      { name: "Reservations", description: "Reservas" },
      { name: "Graph", description: "Análisis y recomendaciones basadas en grafo" },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      // =========================
      // RESPUESTAS REUTILIZABLES
      // =========================
      responses: {
        Unauthorized: {
          description: "No autorizado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "Acceso denegado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Recurso no encontrado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        InternalServerError: {
          description: "Error interno del servidor",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },

      schemas: {
        // =========================
        // ERROR (genérico)
        // =========================
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error interno del servidor",
            },
          },
        },

        // =========================
        // USER
        // =========================
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            first_name: { type: "string", example: "Juan" },
            last_name: { type: "string", example: "Pérez" },
            email: { type: "string", example: "juan@test.com" },
            keycloak_id: {
              type: "string",
              example: "kc-user-001",
              readOnly: true, // dato interno, no se debería enviar desde el cliente
            },
            is_active: { type: "boolean", example: true },
          },
        },

        UpdateUserRequest: {
          type: "object",
          properties: {
            first_name: { type: "string", example: "Juan" },
            last_name: { type: "string", example: "Pérez" },
            email: { type: "string", example: "juan@test.com" },
          },
        },

        // =========================
        // RESTAURANT
        // =========================
        Restaurant: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Soda Tapia" },
            admin: { type: "object" },
            location: { type: "object" },
          },
        },

        CreateRestaurantRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Soda Tapia" },
            admin_id: { type: "integer", example: 1 },
            location_id: { type: "integer", example: 1 },
          },
        },

        // =========================
        // MENU
        // =========================
        Menu: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Menú del día" },
            restaurant: { $ref: "#/components/schemas/Restaurant" },
            plates: {
              type: "array",
              items: { type: "object" },
            },
          },
        },

        CreateMenuRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Menú del día" },
            restaurant_id: { type: "integer", example: 1 },
          },
        },

        UpdateMenuRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Menú actualizado" },
          },
        },

        // =========================
        // ORDER
        // =========================
        CreateOrderRequest: {
          type: "object",
          required: ["user_id", "restaurant_id"],
          properties: {
            user_id: { type: "integer", example: 1 },
            restaurant_id: { type: "integer", example: 1 },
            pickup: { type: "boolean", example: false },
          },
        },

        Order: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            pickup: { type: "boolean", example: false },
            user: { $ref: "#/components/schemas/User" },
            restaurant: { $ref: "#/components/schemas/Restaurant" },
            items: {
              type: "array",
              items: { type: "object" },
            },
          },
        },

        // =========================
        // RESERVATION
        // =========================
        CreateReservationRequest: {
          type: "object",
          required: ["reservation_date", "reservation_time", "people_count"],
          properties: {
            user_id: { type: "integer", example: 1 },
            restaurant_id: { type: "integer", example: 1 },
            reservation_date: {
              type: "string",
              format: "date",
              example: "2026-12-25",
            },
            reservation_time: { type: "string", example: "20:00" },
            people_count: { type: "integer", example: 4 },
          },
        },

        Reservation: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            reservation_date: {
              type: "string",
              format: "date",
              example: "2026-12-25",
            },
            reservation_time: { type: "string", example: "20:00" },
            people_count: { type: "integer", example: 4 },
            user: { $ref: "#/components/schemas/User" },
            restaurant: { $ref: "#/components/schemas/Restaurant" },
          },
        },

        // =========================
        // AUTH
        // =========================
        AuthRegisterRequest: {
          type: "object",
          required: ["first_name", "last_name", "email", "password"],
          properties: {
            first_name: { type: "string", example: "Juan" },
            last_name: { type: "string", example: "Pérez" },
            email: { type: "string", example: "juan@correo.com" },
            password: { type: "string", example: "pass123" },
            role_name: {
              type: "string",
              enum: ["cliente_restaurante", "admin_restaurante"],
              example: "cliente_restaurante",
            },
          },
        },

        AuthLoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "juan@correo.com" },
            password: { type: "string", example: "pass123" },
          },
        },

        AuthLoginResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login exitoso" },
            access_token: { type: "string" },
            refresh_token: { type: "string" },
            expires_in: { type: "integer", example: 3600 },
          },
        },
      },
    },

    // Seguridad por defecto para TODAS las operaciones.
    // Las rutas públicas (login, register) deben sobreescribir esto con `security: []`
    security: [{ bearerAuth: [] }],
  },

  // Glob de archivos donde swagger-jsdoc busca los comentarios @swagger.
  // Se agregó la carpeta graph, que antes no estaba incluida.
  apis: [
    "./dist/routes/*.js",
    "./src/routes/*.ts",
    "./dist/graph/*.routes.js",
    "./src/graph/*.routes.ts",
  ],
};

// Se exporta el spec (además de las opciones) para poder volcarlo a un
// openapi.json estático que alimenta el portal de documentación (Docusaurus/Redoc).
export const swaggerOptions = options;
export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};