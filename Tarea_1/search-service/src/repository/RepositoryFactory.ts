import { PostgresProductRepository } from "./PostgresProductRepository";
import { MongoProductRepository } from "./MongoProductRepository";

export class RepositoryFactory {

  static getProductRepository() {
    if (process.env.DB_TYPE === "mongo") {
      return new MongoProductRepository();
    }
    return new PostgresProductRepository();
  }
}