import { MongoDatabase } from "../../database/mongo/MongoDatabase";
import { Menu } from "../../model/Menu";
import { IMenuRepository } from "../IMenuRepository";

export class MongoMenuRepository implements IMenuRepository {
  private get collection() {
    return MongoDatabase.getDb().collection<Menu>("menus");
  }

  async findById(id: number): Promise<Menu | null> {
    const doc = await this.collection.findOne({ id });
    return doc ? this.mapEntity(doc) : null;
  }

  async create(data: Partial<Menu> & { restaurant_id?: number }): Promise<Menu> {
    const newMenu = {
      ...data,
      id: Math.floor(Math.random() * 10000000),
    } as Menu;

    await this.collection.insertOne(newMenu);
    return newMenu;
  }

  async update(id: number, data: Partial<Menu>): Promise<Menu | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: data },
      { returnDocument: 'after' }
    );
    return result ? this.mapEntity(result as unknown as Menu) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount === 1;
  }

  private mapEntity(doc: any): Menu {
    const { _id, ...rest } = doc;
    return rest as Menu;
  }
}