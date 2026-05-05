import { Request, Response } from "express";
import { RepositoryFactory } from "../repository/RepositoryFactory";
import { cacheHelper } from "../database/redis";

const restaurantRepository = RepositoryFactory.getRestaurantRepository();

export class RestaurantController {
  
  // Obtener todos los restaurantes
  static async getRestaurants(req: Request, res: Response) {
    try {
      const restaurants = await restaurantRepository.findAll();
      
      res.json(restaurants);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener restaurantes" });
    }
  }

  // Crear un nuevo restaurante
  static async createRestaurant(req: Request, res: Response) {
    try {
      const { name, location_id, admin_id } = req.body;

      const restaurant = await restaurantRepository.create({
        name,
        location_id,
        admin_id
      });

      // Invalidamos la caché de restaurantes general para evitar listados desactualizados
      // req.originalUrl es el path original del lado del enrutador (por ejemplo /restaurants)
      await cacheHelper.del(req.originalUrl);

      res.status(201).json(restaurant);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear el restaurante" });
    }
  }
}
