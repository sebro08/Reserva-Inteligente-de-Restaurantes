import { pool } from "../database/pg";
import { ProductRepository } from "./ProductRepository";

type ProductDTO = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export class PostgresProductRepository implements ProductRepository {

  async getAllProducts(): Promise<ProductDTO[]> {
    const result = await pool.query(`
        SELECT 
            p.id,
            p.name,
            COALESCE(p.description, 'Producto sin descripción') AS description,
            c.name AS category
        FROM plate p
        JOIN category c ON p.category_id = c.id
        `);
    return result.rows;
  }
}