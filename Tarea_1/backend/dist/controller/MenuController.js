"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const data_source_1 = require("../database/data-source");
const Menu_1 = require("../model/Menu");
const Restaurant_1 = require("../model/Restaurant");
const menuRepository = data_source_1.AppDataSource.getRepository(Menu_1.Menu);
class MenuController {
    // Crear un nuevo menú
    static async createMenu(req, res) {
        try {
            const { name, restaurant_id } = req.body;
            const menu = new Menu_1.Menu();
            menu.name = name;
            if (restaurant_id) {
                const restaurantRepo = data_source_1.AppDataSource.getRepository(Restaurant_1.Restaurant);
                const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });
                if (restaurant)
                    menu.restaurant = restaurant;
            }
            await menuRepository.save(menu);
            res.status(201).json(menu);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al crear el menú" });
        }
    }
    // Obtener detalles de un menú
    static async getMenu(req, res) {
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
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al obtener el menú" });
        }
    }
    // Actualizar un menú
    static async updateMenu(req, res) {
        try {
            const { id } = req.params;
            const menu = await menuRepository.findOneBy({ id: parseInt(id) });
            if (!menu) {
                return res.status(404).json({ message: "Menú no encontrado" });
            }
            menuRepository.merge(menu, req.body);
            const results = await menuRepository.save(menu);
            res.json(results);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al actualizar el menú" });
        }
    }
    // Eliminar un menú
    static async deleteMenu(req, res) {
        try {
            const { id } = req.params;
            const results = await menuRepository.delete(parseInt(id));
            if (results.affected === 0) {
                return res.status(404).json({ message: "Menú no encontrado" });
            }
            res.json({ message: "Menú eliminado con éxito" });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al eliminar el menú" });
        }
    }
}
exports.MenuController = MenuController;
