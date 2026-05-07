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
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        // =========================
        // USER
        // =========================
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            first_name: {
              type: "string",
              example: "Juan",
            },
            last_name: {
              type: "string",
              example: "Pérez",
            },
            email: {
              type: "string",
              example: "juan@test.com",
            },
            keycloak_id: {
              type: "string",
              example: "kc-user-001",
            },
            is_active: {
              type: "boolean",
              example: true,
            },
          },
        },

        UpdateUserRequest: {
          type: "object",
          properties: {
            first_name: {
              type: "string",
              example: "Juan",
            },
            last_name: {
              type: "string",
              example: "Pérez",
            },
            email: {
              type: "string",
              example: "juan@test.com",
            },
          },
        },

        // =========================
        // RESTAURANT
        // =========================
        Restaurant: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Soda Tapia",
            },
            admin: {
              type: "object",
            },
            location: {
              type: "object",
            },
          },
        },

        CreateRestaurantRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              example: "Soda Tapia",
            },
            admin_id: {
              type: "integer",
              example: 1,
            },
            location_id: {
              type: "integer",
              example: 1,
            },
          },
        },

        // =========================
        // MENU
        // =========================
        Menu: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Menú del día",
            },
            restaurant: {
              $ref: "#/components/schemas/Restaurant",
            },
            plates: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },

        CreateMenuRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              example: "Menú del día",
            },
            restaurant_id: {
              type: "integer",
              example: 1,
            },
          },
        },

        UpdateMenuRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Menú actualizado",
            },
          },
        },

        // =========================
        // ORDER
        // =========================
        CreateOrderRequest: {
          type: "object",
          required: ["user_id", "restaurant_id"],
          properties: {
            user_id: {
              type: "integer",
              example: 1,
            },
            restaurant_id: {
              type: "integer",
              example: 1,
            },
            pickup: {
              type: "boolean",
              example: false,
            },
          },
        },

        Order: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            pickup: {
              type: "boolean",
              example: false,
            },
            user: {
              $ref: "#/components/schemas/User",
            },
            restaurant: {
              $ref: "#/components/schemas/Restaurant",
            },
            items: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },

        // =========================
        // RESERVATION
        // =========================
        CreateReservationRequest: {
          type: "object",
          required: [
            "reservation_date",
            "reservation_time",
            "people_count",
          ],
          properties: {
            user_id: {
              type: "integer",
              example: 1,
            },
            restaurant_id: {
              type: "integer",
              example: 1,
            },
            reservation_date: {
              type: "string",
              format: "date",
              example: "2025-12-25",
            },
            reservation_time: {
              type: "string",
              example: "20:00",
            },
            people_count: {
              type: "integer",
              example: 4,
            },
          },
        },

        Reservation: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            reservation_date: {
              type: "string",
              format: "date",
              example: "2025-12-25",
            },
            reservation_time: {
              type: "string",
              example: "20:00",
            },
            people_count: {
              type: "integer",
              example: 4,
            },
            user: {
              $ref: "#/components/schemas/User",
            },
            restaurant: {
              $ref: "#/components/schemas/Restaurant",
            },
          },
        },

        // =========================
        // AUTH
        // =========================
        AuthRegisterRequest: {
          type: "object",
          required: [
            "first_name",
            "last_name",
            "email",
            "password",
          ],
          properties: {
            first_name: {
              type: "string",
              example: "Juan",
            },
            last_name: {
              type: "string",
              example: "Pérez",
            },
            email: {
              type: "string",
              example: "juan@correo.com",
            },
            password: {
              type: "string",
              example: "pass123",
            },
            role_name: {
              type: "string",
              enum: [
                "cliente_restaurante",
                "admin_restaurante",
              ],
              example: "cliente_restaurante",
            },
          },
        },

        AuthLoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "juan@correo.com",
            },
            password: {
              type: "string",
              example: "pass123",
            },
          },
        },

        AuthLoginResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Login exitoso",
            },
            access_token: {
              type: "string",
            },
            refresh_token: {
              type: "string",
            },
            expires_in: {
              type: "integer",
              example: 3600,
            },
          },
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
};