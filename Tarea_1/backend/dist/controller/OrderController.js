"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const data_source_1 = require("../database/data-source");
const Order_1 = require("../model/Order");
const User_1 = require("../model/User");
const Restaurant_1 = require("../model/Restaurant");
const orderRepository = data_source_1.AppDataSource.getRepository(Order_1.Order);
class OrderController {
    // POST /orders - Realizar un pedido
    static async createOrder(req, res) {
        try {
            const { user_id, restaurant_id, pickup } = req.body;
            const order = new Order_1.Order();
            order.pickup = pickup || false;
            order.created_at = new Date(); // timestamp
            if (user_id) {
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                const user = await userRepo.findOneBy({ id: user_id });
                if (user)
                    order.user = user;
            }
            if (restaurant_id) {
                const restaurantRepo = data_source_1.AppDataSource.getRepository(Restaurant_1.Restaurant);
                const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });
                if (restaurant)
                    order.restaurant = restaurant;
            }
            // Notas: Aquí también podría guardar en OrderItem
            await orderRepository.save(order);
            res.status(201).json(order);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al realizar el pedido" });
        }
    }
    // GET /orders/:id - Obtener detalles de un pedido
    static async getOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await orderRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["user", "restaurant", "items"]
            });
            if (!order) {
                return res.status(404).json({ message: "Pedido no encontrado" });
            }
            res.json(order);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al obtener el pedido" });
        }
    }
}
exports.OrderController = OrderController;
