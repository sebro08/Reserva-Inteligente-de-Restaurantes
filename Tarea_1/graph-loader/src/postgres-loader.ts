import { Pool } from "pg";
import { config } from "./config";

export const pgPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,      // ← desde config, no process.env
  user: config.postgres.user,      // ← desde config
  password: config.postgres.password, // ← desde config
  database: config.postgres.database, // ← desde config
});

export async function testPostgres(): Promise<void> {
  const result = await pgPool.query(`
    SELECT COUNT(*) AS total
    FROM restaurant
  `);
  console.log("Postgres conectado. Restaurantes:", result.rows[0].total);
}

export async function closePostgres(): Promise<void> {
  await pgPool.end();
}