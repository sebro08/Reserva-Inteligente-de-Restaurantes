import express from "express";
import searchRoutes from "./routes/SearchRoutes";
import { ElasticService } from "./services/ElasticService";
import { MongoDatabase } from "./database/mongo";

const app = express();
app.use(express.json());

app.use(searchRoutes);

const PORT = 3001;

async function bootstrap() {
  try {
    console.log(`Search service corriendo en puerto ${PORT}`);

    //  Inicializar Mongo solo si se usa
    if (process.env.DB_TYPE === "mongo") {
      await MongoDatabase.connect();
      console.log("Conectado a MongoDB");
    }

    //  SIEMPRE inicializar índice de Elasticsearch
    await ElasticService.createIndex("products");
    console.log("Índice de Elasticsearch listo");

    app.listen(PORT, () => {
      console.log(`Search service escuchando en puerto ${PORT}`);
    });

  } catch (error) {
    console.error("Error iniciando search-service:", error);
    process.exit(1);
  }
}

bootstrap();