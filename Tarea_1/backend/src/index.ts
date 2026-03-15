import express, { Request, Response } from "express";
import "reflect-metadata";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { AppDataSource } from "./database/data-source";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "restaurante-api" });
});

AppDataSource.initialize()
  .then(() => {
    console.log(
      "Entidades cargadas:",
      AppDataSource.entityMetadatas.map(e => e.name)
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
