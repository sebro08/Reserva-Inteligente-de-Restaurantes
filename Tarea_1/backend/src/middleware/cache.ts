import { Request, Response, NextFunction } from "express";
import { cacheHelper } from "../database/redis";

/**
 * Middleware para cachear respuestas HTTP (GET) en Redis usando la URL como llave y el JSON como valor.
 * @param ttlSeconds Tiempo de vida de la caché en segundos (TTL)
 */
export const cacheMiddleware = (ttlSeconds: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Solo se debe cachear llamadas de lectura (GET)
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl; // Como mencionó el profesor, usamos la URL como llave

    try {
      const cachedResponse = await cacheHelper.get(key);
      if (cachedResponse) {
        // Enviar JSON guardado en cache
        const jsonResponse = JSON.parse(cachedResponse);
        return res.json(jsonResponse);
      }

      // Si no está en caché, interceptamos `res.json` para guardar la respuesta antes de enviarla
      const originalJson = res.json.bind(res);
      res.json = (body: any): any => {
        // Guardamos el body de la respuesta como JSON string en Redis
        cacheHelper.set(key, JSON.stringify(body), ttlSeconds);
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Error en cache middleware, saltando caché:", error);
      next();
    }
  };
};
