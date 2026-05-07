export const responses = {
  Unauthorized: {
    description: "No autorizado",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
      },
    },
  },

  Forbidden: {
    description: "Acceso denegado",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
      },
    },
  },

  NotFound: {
    description: "Recurso no encontrado",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
      },
    },
  },

  InternalServerError: {
    description: "Error interno del servidor",
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse",
        },
      },
    },
  },
};