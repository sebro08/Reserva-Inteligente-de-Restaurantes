import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Menu } from "../model/Menu";
import { Restaurant } from "../model/Restaurant";

const menuRepository = AppDataSource.getRepository(Menu);

export class MenuController {
  
  // Crear un nuevo menú
  static async createMenu(req: Request, res: Response) {
    try {
      const { name, restaurant_id } = req.body;
      
      const menu = new Menu();
      menu.name = name;
      
      if (restaurant_id) {
        const restaurantRepo = AppDataSource.getRepository(Restaurant);
        const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });
        if (restaurant) menu.restaurant = restaurant;
      }

      await menuRepository.save(menu);
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
      const menu = await menuRepository.findOne({
        where: { id: parseInt(id) },
        relations: ["restaurant", "plates"] // plates vienen de la BD según Plate.ts
      });

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
      const menu = await menuRepository.findOneBy({ id: parseInt(id) });
      
      if (!menu) {
        return res.status(404).json({ message: "Menú no encontrado" });
      }

      menuRepository.merge(menu, req.body);
      const results = await menuRepository.save(menu);
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar el menú" });
    }
  }

  // Eliminar un menú
  static async deleteMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const results = await menuRepository.delete(parseInt(id));
      
      if (results.affected === 0) {
         return res.status(404).json({ message: "Menú no encontrado" });
      }
      
      res.json({ message: "Menú eliminado con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar el menú" });
    }
  }
}
