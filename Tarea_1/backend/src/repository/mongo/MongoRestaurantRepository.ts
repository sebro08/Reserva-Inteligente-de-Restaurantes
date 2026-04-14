import { IRestaurantRepository } from "../IRestaurantRepository";
import { Restaurant } from "../../model/Restaurant";
import { MongoDatabase } from "../../database/mongo/MongoDatabase";
import { ObjectId } from "mongodb";

export class MongoRestaurantRepository implements IRestaurantRepository {
  private get collection() {
    return MongoDatabase.getDb().collection<Restaurant>("restaurants");
  }

  async findAll(): Promise<Restaurant[]> {
    const docs = await this.collection.find().toArray();
    return docs.map(this.mapEntity);
  }

  async findById(id: number): Promise<Restaurant | null> {
    const doc = await this.collection.findOne({ id });
    return doc ? this.mapEntity(doc) : null;
  }

  async create(data: Partial<Restaurant> & { location_id?: number; admin_id?: number }): Promise<Restaurant> {
    // Para simplificar, usamos un timestamp/rand para emular un id autoincremental en NoSQL
    // También podría usar ObjectIds, pero hay cumplir con la interfaz que espera un 'number'
    const newId = Math.floor(Math.random() * 10000000); 
    
    const newRestaurant = {
      ...data,
      id: newId,
      created_at: new Date(),
    } as Restaurant;

    await this.collection.insertOne(newRestaurant);
    return newRestaurant;
  }

  async update(id: number, data: Partial<Restaurant>): Promise<Restaurant | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    
    return result ? this.mapEntity(result as unknown as Restaurant) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount === 1;
  }

  // Mapeamos el ID de MongoDB (ObjectId) de vuelta a nuestro modelo si es necesario, 
  // o eliminamos el _id de la salida.
  private mapEntity(doc: any): Restaurant {
    const { _id, ...rest } = doc;
    return rest as Restaurant;
  }
}