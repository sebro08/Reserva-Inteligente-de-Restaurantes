import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Restaurant } from "../model/Restaurant";
import { User } from "../model/User";
import { Location } from "../model/Location";

const restaurantRepository = AppDataSource.getRepository(Restaurant);

export class RestaurantController {
  
  // Obtener todos los restaurantes
  static async getRestaurants(req: Request, res: Response) {
    try {
      const restaurants = await restaurantRepository.find({
        relations: ["location", "admin"],
      });
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

      const restaurant = new Restaurant();
      restaurant.name = name;
      restaurant.created_at = new Date(); // Asumiendo fecha actual

      if (admin_id) {
        const userRepo = AppDataSource.getRepository(User);
        const admin = await userRepo.findOneBy({ id: admin_id });
        if (admin) restaurant.admin = admin;
      }

      if (location_id) {
        const locationRepo = AppDataSource.getRepository(Location);
        const location = await locationRepo.findOneBy({ id: location_id });
        if (location) restaurant.location = location;
      }

      await restaurantRepository.save(restaurant);

      res.status(201).json(restaurant);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear el restaurante" });
    }
  }
}
