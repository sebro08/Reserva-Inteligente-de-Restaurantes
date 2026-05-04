import { createClient } from "redis";

// Variables de entorno
const redisUrl = process.env.REDIS_URL;
const isTestEnv = process.env.NODE_ENV === "test";

// Solo fallar fuera de test
if (!redisUrl && !isTestEnv) {
  console.error("ERROR CRÍTICO: La variable de entorno REDIS_URL no está definida.");
  process.exit(1);
}

// -----------------------------
// Mock para testing
// -----------------------------
const mockClient = {
  isReady: false,
  connect: async () => {},
  get: async (_key: string) => null,
  setEx: async (_key: string, _ttl: number, _value: string) => {},
  del: async (_key: string) => {},
  on: () => {},
};

// -----------------------------
// Cliente real
// -----------------------------
const realClient = createClient({
  url: redisUrl,
});

// Eventos SOLO fuera de test
if (!isTestEnv) {
  realClient.on("error", () => {
    console.error("Error en el cliente de Redis");
  });

  realClient.on("ready", () => {
    console.log("Conectado a Redis exitosamente");
  });
}

// Elegir cliente según entorno
export const redisClient = isTestEnv ? mockClient : realClient;

// Conectar SOLO fuera de test
if (!isTestEnv) {
  redisClient.connect().catch((err) => {
    console.error("No se pudo conectar a Redis:", err);
  });
}

// -----------------------------
// Helper de cache
// -----------------------------
export const cacheHelper = {
  async get(key: string): Promise<string | null> {
    if (!redisClient.isReady) return null;
    try {
      return await redisClient.get(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    if (!redisClient.isReady) return;
    try {
      await redisClient.setEx(key, ttlSeconds, value);
    } catch {
      // fail silently
    }
  },

  async del(key: string): Promise<void> {
    if (!redisClient.isReady) return;
    try {
      await redisClient.del(key);
    } catch {
      // fail silently
    }
  }
};