import { Client } from "@elastic/elasticsearch";

export class ElasticService {

  // EXPONER CLIENT
  static client = new Client({
    node: process.env.ELASTIC_URL || "http://elasticsearch-svc:9200"
  });

  static async ping() {
    return ElasticService.client.ping();
  }
  
  static async createIndex(index: string) {
    const exists = await this.client.indices.exists({ index });

    const existsValue = (exists as any).body ?? exists;

    if (!existsValue) {
      console.log("Creando índice:", index);

      await this.client.indices.create({
        index,
        mappings: {
          properties: {
            name: { type: "text" },
            category: { type: "keyword" },
            description: { type: "text" }
          }
        }
      });

    } else {
      console.log("Índice ya existe:", index);
    }
  }

  static async deleteIndex(index: string) {
    try {
      await this.client.indices.delete({ index });
    } catch (error: any) {
      if (error.meta?.body?.error?.type !== "index_not_found_exception") {
        throw error;
      }
    }
  }

  static async bulkIndexProducts(products: any[]) {
    if (!products || products.length === 0) return;

    const operations = products.flatMap(p => [
      { index: { _index: "products", _id: String(p.id) } },
      {
        name: p.name,
        category: p.category,
        description: p.description || "Producto sin descripcion"
      }
    ]);

    try {
      const response = await this.client.bulk({
        operations,
        refresh: true
      });

      // Elasticsearch puede devolver 200 OK pero con errores internos
      if (response.errors) {
        const errores = response.items
          .map((item: any, i: number) => {
            const action = item.index;
            if (action?.error) {
              return {
                status: action.status,
                error: action.error,
                documento: products[i]
              };
            }
            return null;
          })
          .filter(Boolean);

        console.error("Errores en bulk:", JSON.stringify(errores, null, 2));
      } else {
        console.log(`Bulk exitoso: ${products.length} documentos indexados`);
      }

    } catch (error) {
      console.error("Error ejecutando bulk:", error);
      throw error;
    }
  }

  static async search(q: string) {
    const result = await this.client.search({
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
    const result = await this.client.search({
      index: "products",
      query: {
        term: { category }
      }
    });

    return result.hits.hits;
  }
}