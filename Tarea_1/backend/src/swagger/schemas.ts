export const schemas = {
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
    },
  },

  Menu: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 1,
      },
      name: {
        type: "string",
        example: "Menú Ejecutivo",
      },
      restaurant_id: {
        type: "integer",
        example: 1,
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
        example: "2026-12-25",
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

  AuthResponse: {
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

  ErrorResponse: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "Error interno del servidor",
      },
    },
  },
};