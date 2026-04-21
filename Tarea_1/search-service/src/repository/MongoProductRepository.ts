import { MongoDatabase } from "../database/mongo";
import { ProductRepository } from "./ProductRepository";

type ProductDTO = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export class MongoProductRepository implements ProductRepository {

  private get collection() {
    return MongoDatabase.getDb().collection("plate");
  }

  async getAllProducts(): Promise<ProductDTO[]> {
    const products = await this.collection.find().toArray();

    return products.map((p: any) => ({
      id: String(p._id),
      name: p.name,
      description: p.description || "Producto sin descripción",
      category: this.extractCategory(p)
    }));
  }

  private extractCategory(p: any): string {
    if (p.category && typeof p.category === "object") {
      return p.category.name;
    }

    if (typeof p.category === "string") {
      return p.category;
    }

    return "Sin categoría";
  }
}