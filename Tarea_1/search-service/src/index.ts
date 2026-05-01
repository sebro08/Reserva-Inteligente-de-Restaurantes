import express from "express";
import searchRoutes from "./routes/SearchRoutes";
import { ElasticService } from "./services/ElasticService";
import { MongoDatabase } from "./database/mongo";

const app = express();
app.use(express.json());

app.use(searchRoutes);

const PORT = 3001;

async function waitForElasticsearch() {
  const maxRetries = 30;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await ElasticService.ping();
      console.log("✅ Elasticsearch conectado");
      return;
    } catch (err) {
      attempt++;
      console.log(`⏳ Esperando Elasticsearch... (${attempt}/${maxRetries})`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  throw new Error("❌ Elasticsearch no disponible después de múltiples intentos");
}

async function bootstrap() {
  try {
    console.log(`Iniciando search service...`);

    // Mongo opcional
    if (process.env.DB_TYPE === "mongo") {
      await MongoDatabase.connect();
      console.log("Conectado a MongoDB");
    }

    // esperar ES primero
    await waitForElasticsearch();

    // crear índice
    await ElasticService.createIndex("products");
    console.log("Índice de Elasticsearch listo");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Search service escuchando en puerto ${PORT}`);
    });

  } catch (error) {
    console.error("Error iniciando search-service:", error);
    process.exit(1);
  }
}

bootstrap();