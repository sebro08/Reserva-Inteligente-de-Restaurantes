"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantController = void 0;
const data_source_1 = require("../database/data-source");
const Restaurant_1 = require("../model/Restaurant");
const User_1 = require("../model/User");
const Location_1 = require("../model/Location");
const restaurantRepository = data_source_1.AppDataSource.getRepository(Restaurant_1.Restaurant);
class RestaurantController {
    // Obtener todos los restaurantes
    static async getRestaurants(req, res) {
        try {
            const restaurants = await restaurantRepository.find({
                relations: ["location", "admin"],
            });
            res.json(restaurants);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al obtener restaurantes" });
        }
    }
    // Crear un nuevo restaurante
    static async createRestaurant(req, res) {
        try {
            const { name, location_id, admin_id } = req.body;
            const restaurant = new Restaurant_1.Restaurant();
            restaurant.name = name;
            restaurant.created_at = new Date(); // Asumiendo fecha actual
            if (admin_id) {
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                const admin = await userRepo.findOneBy({ id: admin_id });
                if (admin)
                    restaurant.admin = admin;
            }
            if (location_id) {
                const locationRepo = data_source_1.AppDataSource.getRepository(Location_1.Location);
                const location = await locationRepo.findOneBy({ id: location_id });
                if (location)
                    restaurant.location = location;
            }
            await restaurantRepository.save(restaurant);
            res.status(201).json(restaurant);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al crear el restaurante" });
        }
    }
}
exports.RestaurantController = RestaurantController;
