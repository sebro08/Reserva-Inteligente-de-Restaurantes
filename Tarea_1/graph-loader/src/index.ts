// index.ts — SIN ningún dotenv aquí
import { config } from "./config";  // ← config.ts carga los .env correctos
import { testPostgres, closePostgres } from "./postgres-loader";
import { testMongo, closeMongo } from "./mongo-loader";
import { testNeo4j, closeNeo4j } from "./neo4j.service";

async function main(): Promise<void> {
  try {
    await testPostgres();
    await testMongo();
    await testNeo4j();
    console.log("\nTodas las conexiones funcionan correctamente");
  } finally {
    await closePostgres();
    await closeMongo();
    await closeNeo4j();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});