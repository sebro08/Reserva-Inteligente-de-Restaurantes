import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: process.env.ELASTIC_URL || "http://elasticsearch:9200"
});

export class ElasticService {

  static async createIndex(index: string) {
    const exists = await client.indices.exists({ index });

    if (!exists) {
      await client.indices.create({
        index,
        mappings: {
          properties: {
            name: { type: "text" },
            category: { type: "keyword" },
            description: { type: "text" }
          }
        }
      });
    }
  }

  static async deleteIndex(index: string) {
    try {
      await client.indices.delete({ index });
    } catch (error: any) {
      if (error.meta?.body?.error?.type !== "index_not_found_exception") {
        throw error;
      }
    }
  }

  static async bulkIndexProducts(products: any[]) {
    if (products.length === 0) return;

    console.log("Primer producto:", JSON.stringify(products[0]));
    
    const operations = products.flatMap(p => [
      { index: { _index: "products", _id: String(p.id) } },
      {
        name: p.name,
        category: p.category,
        description: p.description || "Producto sin descripcion"
      }
    ]);

    await client.bulk({ operations, refresh: true });
  }

  static async search(q: string) {
    const result = await client.search({
      index: "products",
      query: {
        multi_match: {
          query: q,
          fields: ["name^2", "description", "category"]
        }
      }
    });

    return result.hits.hits;
  }

  static async searchByCategory(category: string) {
    const result = await client.search({
      index: "products",
      query: {
        term: {
          category: category
        }
      }
    });

    return result.hits.hits;
  }
}