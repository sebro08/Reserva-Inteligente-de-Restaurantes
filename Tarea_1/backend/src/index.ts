import express, { Request, Response } from "express";
import "reflect-metadata";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import session from "express-session";

import { setupSwagger } from "./swagger";
import routes from "./routes";
import { AppDataSource } from "./database/data-source";
import { keycloak, memoryStore } from "./middleware/keycloak";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// Middlewares base
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Session (requerido por Keycloak)
// ─────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave-secreta-restaurante",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

// ─────────────────────────────────────────────
// Keycloak middleware
// ─────────────────────────────────────────────
app.use(keycloak.middleware());

// ─────────────────────────────────────────────
// Swagger
// ─────────────────────────────────────────────
setupSwagger(app);

// ─────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────
app.use("/", routes);

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "restaurante-api" });
});

// ─────────────────────────────────────────────
// Inicialización SOLO fuera de tests
// ─────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  AppDataSource.initialize()
    .then(() => {
      console.log(
        "Entidades cargadas:",
        AppDataSource.entityMetadatas.map((e) => e.name)
      );

      console.log("Conectado a la base de datos");

      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
      });
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        console.error("Error al conectar la base de datos:", error.message);
      } else {
        console.error("Error desconocido:", error);
      }
    });
}