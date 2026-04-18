import { createClient } from "redis";

// Usar estrictamente la variable de entorno para buenas prácticas de seguridad.
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error("ERROR CRÍTICO: La variable de entorno REDIS_URL no está definida.");
  process.exit(1); // Fail-fast: detenemos la aplicación si la infraestructura no está configurada
}

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  // Manejo de errores silencioso para no crashear la app entera.
  // Esto permite la Tolerancia a Fallos (si Redis la palma, la app sigue operando directamente hacia la BD).
  console.error("Error en el cliente de Redis");
});

redisClient.on("ready", () => {
  console.log("Conectado a Redis exitosamente");
});

redisClient.connect().catch((err) => {
    console.error("No se pudo conectar a Redis:", err);
});

// Helper methods for safe cache access
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
      // Ignorar errores para seguir funcionando
    }
  },
  async del(key: string): Promise<void> {
    if (!redisClient.isReady) return;
    try {
      await redisClient.del(key);
    } catch {
      // Ignorar errores
    }
  }
};

