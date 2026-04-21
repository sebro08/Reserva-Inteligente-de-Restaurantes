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

console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

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
  const dbType = process.env.DB_TYPE || "postgres";

  const initDb = async () => {
    try {
      if (dbType === "postgres") {
        await AppDataSource.initialize();
        console.log(
          "Entidades cargadas:",
          AppDataSource.entityMetadatas.map((e) => e.name)
        );
        console.log("Conectado a la base de datos PostgreSQL");
      } else if (dbType === "mongodb") {
        const { MongoDatabase } = require("./database/mongo/MongoDatabase");
        await MongoDatabase.connect();
        console.log("Conectado a la base de datos MongoDB");
      }

      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error al conectar la base de datos:", error.message);
      } else {
        console.error("Error desconocido:", error);
      }
    }
  };

  initDb();
}