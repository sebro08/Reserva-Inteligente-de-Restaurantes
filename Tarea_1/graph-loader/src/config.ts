import dotenv from "dotenv";
import path from "path";

const localEnv = path.resolve(__dirname, "../.env.local");
const rootEnv = path.resolve(__dirname, "../../.env");

console.log("Buscando .env local en:", localEnv);
console.log("Buscando .env raíz en:", rootEnv);

dotenv.config({ path: localEnv });
dotenv.config({ path: rootEnv });

console.log("DB_HOST cargado:", process.env.DB_HOST);

console.log("=== VALORES CARGADOS ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USERNAME:", process.env.DB_USERNAME);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("========================");

export const config = {
  postgres: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },

  mongo: {
    uri: process.env.MONGO_URI!,
    database: process.env.MONGO_DB_NAME!,
  },

  neo4j: {
    uri: process.env.NEO4J_URI!,
    username: process.env.NEO4J_USERNAME!,
    password: process.env.NEO4J_PASSWORD!,
  },
};