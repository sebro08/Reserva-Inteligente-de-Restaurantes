import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Order } from "../model/Order";
import { User } from "../model/User";
import { Restaurant } from "../model/Restaurant";

const orderRepository = AppDataSource.getRepository(Order);

export class OrderController {
  
  // POST /orders - Realizar un pedido
  static async createOrder(req: Request, res: Response) {
    try {
      const { user_id, restaurant_id, pickup } = req.body;
      
      const order = new Order();
      order.pickup = pickup || false;
      order.created_at = new Date(); // timestamp

      if (user_id) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: user_id });
        if (user) order.user = user;
      }

      if (restaurant_id) {
        const restaurantRepo = AppDataSource.getRepository(Restaurant);
        const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });
        if (restaurant) order.restaurant = restaurant;
      }

      // Notas: Aquí también podrías guardar en OrderItem

      await orderRepository.save(order);
      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al realizar el pedido" });
    }
  }

  // GET /orders/:id - Obtener detalles de un pedido
  static async getOrder(req: Request, res: Response) {
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener el pedido" });
    }
  }
}
