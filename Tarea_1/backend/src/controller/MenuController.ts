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

      // Obtener desde Base de Datos (el middleware cacheMiddleware ya revisó la caché previamente)
      const menu = await menuRepository.findById(parseInt(id));

      if (!menu) {
        return res.status(404).json({ message: "Menú no encontrado" });
      }

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

      // Invalidamos el caché después de una mutación. La URL original de GET era del tipo /menus/id
      await cacheHelper.del(req.originalUrl); // Elimina /menus/:id
      // En caso que haya más variaciones, la borramos (ej sin API de sufijo si la hubiera):
      // Para estar aún más seguros, podríamos también eliminar basándonos en baseUrl si fuera necesario.

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
      
      // Invalidar en caché usando la url original
      await cacheHelper.del(req.originalUrl);

      res.json({ message: "Menú eliminado con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar el menú" });
    }
  }
}
