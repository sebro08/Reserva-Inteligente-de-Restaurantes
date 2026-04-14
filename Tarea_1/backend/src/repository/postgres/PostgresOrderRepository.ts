import { AppDataSource } from "../../database/data-source";
import { Order } from "../../model/Order";
import { User } from "../../model/User";
import { Restaurant } from "../../model/Restaurant";
import { IOrderRepository } from "../IOrderRepository";

export class PostgresOrderRepository implements IOrderRepository {
  private repository = AppDataSource.getRepository(Order);

  async findById(id: number): Promise<Order | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["user", "restaurant", "items"]
    });
  }

  async create(data: Partial<Order> & { user_id?: number, restaurant_id?: number }): Promise<Order> {
    const order = new Order();
    order.pickup = data.pickup || false;
    order.created_at = new Date(); 

    if (data.user_id) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: data.user_id });
      if (user) order.user = user;
    }

    if (data.restaurant_id) {
      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: data.restaurant_id });
      if (restaurant) order.restaurant = restaurant;
    }

    return await this.repository.save(order);
  }
}
