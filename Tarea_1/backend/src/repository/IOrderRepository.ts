import { Order } from "../model/Order";

export interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
  create(data: Partial<Order> & { user_id?: number, restaurant_id?: number }): Promise<Order>;
}
