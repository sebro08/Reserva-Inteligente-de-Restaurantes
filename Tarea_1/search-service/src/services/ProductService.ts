import { ElasticService } from "./ElasticService";
import { RepositoryFactory } from "../repository/RepositoryFactory";

const productRepository = RepositoryFactory.getProductRepository();

export class ProductService {

  static async reindex() {
    const products = await productRepository.getAllProducts();

    try {
      await ElasticService.deleteIndex("products");
    } catch (error) {
      console.log("Indice no existia, se creara uno nuevo");
    }

    await ElasticService.createIndex("products");
    await ElasticService.bulkIndexProducts(products);

    return { message: "Reindexacion completada" };
  }
}