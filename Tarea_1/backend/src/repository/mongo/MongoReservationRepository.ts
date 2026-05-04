import { MongoDatabase } from "../../database/mongo/MongoDatabase";
import { Reservation } from "../../model/Reservation";
import { IReservationRepository } from "../IReservationRepository";

export class MongoReservationRepository implements IReservationRepository {
  private get collection() {
    return MongoDatabase.getDb().collection<Reservation>("reservations"); // Sharded collection
  }

  async create(data: Partial<Reservation> & { user_id?: number, restaurant_id?: number }): Promise<Reservation> {
    const newRes = {
      ...data,
      id: Math.floor(Math.random() * 10000000),
    } as Reservation;

    await this.collection.insertOne(newRes);
    return newRes;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount === 1;
  }
  async findById(id: number): Promise<Reservation | null> {
    const doc = await this.collection.findOne({ id });      return doc ? this.mapEntity(doc) : null;
  }

  private mapEntity(doc: any): Reservation {
    const { _id, ...rest } = doc;
    return rest as Reservation;
  }
}