import { Request, Response } from "express";
import { RepositoryFactory } from "../repository/RepositoryFactory";

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
      
      res.json({ message: "Menú eliminado con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar el menú" });
    }
  }
}
