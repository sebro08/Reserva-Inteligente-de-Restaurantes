import { Request, Response } from "express";
import { RepositoryFactory } from "../repository/RepositoryFactory";

const orderRepository = RepositoryFactory.getOrderRepository();

export class OrderController {
  
  // POST /orders - Realizar un pedido
  static async createOrder(req: Request, res: Response) {
    try {
      const { user_id, restaurant_id, pickup } = req.body;
      
      const order = await orderRepository.create({
        user_id,
        restaurant_id,
        pickup
      });

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
      const order = await orderRepository.findById(parseInt(id));

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
