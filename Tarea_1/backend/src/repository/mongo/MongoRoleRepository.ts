import { MongoDatabase } from "../../database/mongo/MongoDatabase";
import { Role } from "../../model/Role";
import { IRoleRepository } from "../IRoleRepository";

export class MongoRoleRepository implements IRoleRepository {
  private get collection() {
    return MongoDatabase.getDb().collection<Role>("roles");
  }

  async findByName(name: string): Promise<Role | null> {
    const doc = await this.collection.findOne({ name });
    return doc ? this.mapEntity(doc) : null;
  }

  private mapEntity(doc: any): Role {
    const { _id, ...rest } = doc;
    return rest as Role;
  }
}