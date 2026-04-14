import { MongoDatabase } from "../../database/mongo/MongoDatabase";
import { User } from "../../model/User";
import { IUserRepository } from "../IUserRepository";

export class MongoUserRepository implements IUserRepository {
  private get collection() {
    return MongoDatabase.getDb().collection<User>("users");
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const doc = await this.collection.findOne({ keycloak_id: keycloakId });
    return doc ? this.mapEntity(doc) : null;
  }

  async findById(id: number): Promise<User | null> {
    const doc = await this.collection.findOne({ id });
    return doc ? this.mapEntity(doc) : null;
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    return result ? this.mapEntity(result as unknown as User) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async create(data: Partial<User>): Promise<User> {
    const newUser = {
      ...data,
      id: Math.floor(Math.random() * 10000000), // Numeric ID for compat
      created_at: new Date(),
      updated_at: new Date()
    } as User;

    await this.collection.insertOne(newUser);
    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? this.mapEntity(doc) : null;
  }

  private mapEntity(doc: any): User {
    const { _id, ...rest } = doc;
    return rest as User;
  }
}