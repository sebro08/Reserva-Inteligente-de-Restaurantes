import { MongoDatabase } from "../../database/mongo/MongoDatabase";
import { Order } from "../../model/Order";
import { IOrderRepository } from "../IOrderRepository";

export class MongoOrderRepository implements IOrderRepository {
  private get collection() {
    return MongoDatabase.getDb().collection<Order>("orders");
  }

  async findById(id: number): Promise<Order | null> {
    const doc = await this.collection.findOne({ id });
    return doc ? this.mapEntity(doc) : null;
  }

  async create(data: Partial<Order> & { user_id?: number, restaurant_id?: number }): Promise<Order> {
    const newOrder = {
      ...data,
      id: Math.floor(Math.random() * 10000000),
      created_at: new Date()
    } as Order;

    await this.collection.insertOne(newOrder);
    return newOrder;
  }

  private mapEntity(doc: any): Order {
    const { _id, ...rest } = doc;
    return rest as Order;
  }
}