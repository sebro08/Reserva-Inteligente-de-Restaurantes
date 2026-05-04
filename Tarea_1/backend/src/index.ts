import express, { Request, Response } from "express";
import "reflect-metadata";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import session from "express-session";

import { setupSwagger } from "./swagger";
import routes from "./routes";
import { AppDataSource } from "./database/data-source";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const app = express();
const PORT = process.env.PORT || 3000;
const isTest = process.env.NODE_ENV === "test";

console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

// ─────────────────────────────────────────────
// Middlewares base (SIEMPRE)
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// SOLO en runtime (NO en test)
// ─────────────────────────────────────────────
if (!isTest) {
  const { keycloak, memoryStore } = require("./middleware/keycloak");

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "clave-secreta-restaurante",
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
    })
  );

  app.use(keycloak.middleware());

  setupSwagger(app);

  app.use("/", routes);
}

// ─────────────────────────────────────────────
// Health check (SIEMPRE disponible)
// ─────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "restaurante-api" });
});

// ─────────────────────────────────────────────
// Inicialización SOLO fuera de tests
// ─────────────────────────────────────────────
if (!isTest) {
  const dbType = process.env.DB_TYPE || "postgres";

  const initDb = async () => {
    try {
      if (dbType === "postgres") {
        await AppDataSource.initialize();
        console.log(
          "Entidades cargadas:",
          AppDataSource.entityMetadatas.map((e) => e.name)
        );
        console.log("Conectado a PostgreSQL");
      } else if (dbType === "mongodb") {
        const { MongoDatabase } = require("./database/mongo/MongoDatabase");
        await MongoDatabase.connect();
        console.log("Conectado a MongoDB");
      }

      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
      });
    } catch (error: unknown) {
      console.error("Error al conectar DB:", error);
    }
  };

  initDb();
}