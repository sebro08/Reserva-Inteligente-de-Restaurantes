import { Request, Response } from "express";
import { RepositoryFactory } from "../repository/RepositoryFactory";
import { cacheHelper } from "../database/redis";

const menuRepository = RepositoryFactory.getMenuRepository();

export class MenuController {

  
  // Crear un nuevo menú
  static async createMenu(req: Request, res: Response) {
    try {
      const { name, restaurant_id } = req.body;
      
      const menu = await menuRepository.create({
        name,
        restaurant_id
      });

      res.status(201).json(menu);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear el menú" });
    }
  }

  // Obtener detalles de un menú
  static async getMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cacheKey = `menu:${id}`;

      // Intentar obtener desde la caché (Redis)
      const cachedMenu = await cacheHelper.get(cacheKey);
      if (cachedMenu) {
        return res.json(JSON.parse(cachedMenu));
      }

      // Si no existe, obtener desde Base de Datos
      const menu = await menuRepository.findById(parseInt(id));

      if (!menu) {
        return res.status(404).json({ message: "Menú no encontrado" });
      }

      // Guardar el resultado en caché con un TTL, por ejemplo podemos poner 1 hora (3600 segundos)
      await cacheHelper.set(cacheKey, JSON.stringify(menu));

      res.json(menu);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener el menú" });
    }
  }

  // Actualizar un menú
  static async updateMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const menuUpdated = await menuRepository.update(parseInt(id), req.body);
      
      if (!menuUpdated) {
        return res.status(404).json({ message: "Menú no encontrado" });
      }

      // Invalidamos el caché después de una mutación
      await cacheHelper.del(`menu:${id}`);

      res.json(menuUpdated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar el menú" });
    }
  }

  // Eliminar un menú
  static async deleteMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const isDeleted = await menuRepository.delete(parseInt(id));
      
      if (!isDeleted) {
         return res.status(404).json({ message: "Menú no encontrado" });
      }
      
      // Invalidar en caché
      await cacheHelper.del(`menu:${id}`);

      res.json({ message: "Menú eliminado con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar el menú" });
    }
  }
}
