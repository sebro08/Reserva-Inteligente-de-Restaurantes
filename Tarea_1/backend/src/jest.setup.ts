import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoDatabase } from "./database/mongo/MongoDatabase";
import { TestDataSource } from "./database/data-source.test";
import { TestMongoDataSource } from "./database/mongo-test-db";

dotenv.config();

// Timeout global para integración
jest.setTimeout(30000);

const dbType = process.env.DB_TYPE;

/**
 * =========================
 * BEFORE ALL TESTS
 * =========================
 */
beforeAll(async () => {
  console.log(`🧪 Iniciando tests con DB_TYPE=${dbType}`);

  if (dbType === "mongodb") {
    try {
      /**
       * 🔴 FIX CRÍTICO:
       * Antes estabas llamando getDb() sin connect()
       */
      await MongoDatabase.connect();
      console.log("🟢 MongoDatabase conectado correctamente");

      /**
       * TypeORM Mongo (si lo usas en repositorios)
       */
      if (!TestMongoDataSource.isInitialized) {
        await TestMongoDataSource.initialize();
        console.log("🟢 TypeORM Mongo inicializado");
      }

      /**
       * Mongoose (si lo usas en el proyecto)
       */
      const mongoUri =
        process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test_db";

      await mongoose.connect(mongoUri);
      console.log("🟢 Mongoose conectado");
    } catch (err) {
      console.error("🔴 Error en setup Mongo:", err);
      throw err;
    }
  }

  if (dbType === "postgres") {
    try {
      if (!TestDataSource.isInitialized) {
        await TestDataSource.initialize();
      }
      console.log("🟢 TestDataSource SQL inicializado");
    } catch (err) {
      console.error("🔴 Error iniciando SQL datasource:", err);
      throw err;
    }
  }
});

/**
 * =========================
 * AFTER EACH TEST
 * =========================
 */
afterEach(async () => {
  jest.clearAllMocks();

  if (dbType === "mongodb") {
    try {
      /**
       * Limpieza TypeORM Mongo
       */
      if (TestMongoDataSource.isInitialized) {
        for (const entity of TestMongoDataSource.entityMetadatas) {
          const repo = TestMongoDataSource.getMongoRepository(entity.name);
          await repo.deleteMany({});
        }
      }

      /**
       * Limpieza Mongoose directa (seguridad extra)
       */
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }

      console.log("🧹 Mongo limpiado");
    } catch (err) {
      console.error("Error limpiando Mongo:", err);
    }
  }

  if (dbType === "postgres") {
    try {
      if (TestDataSource.isInitialized) {
        for (const entity of TestDataSource.entityMetadatas) {
          const repo = TestDataSource.getRepository(entity.name);
          await repo.clear();
        }
      }
    } catch (err) {
      console.error("Error limpiando SQL:", err);
    }
  }
});

/**
 * =========================
 * AFTER ALL TESTS
 * =========================
 */
afterAll(async () => {
  try {
    if (dbType === "mongodb") {
      /**
       * Cerrar Mongoose
       */
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      /**
       * Cerrar TypeORM Mongo
       */
      if (TestMongoDataSource.isInitialized) {
        await TestMongoDataSource.destroy();
      }

      console.log("🔴 Mongo completamente desconectado");
    }

    if (dbType === "postgres") {
      if (TestDataSource.isInitialized) {
        await TestDataSource.destroy();
      }
    }

    /**
     * Evita leaks en Jest CI
     */
    await new Promise((r) => setTimeout(r, 500));
  } catch (err) {
    console.error("Error en teardown:", err);
  }
});