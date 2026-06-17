import { Pool } from "pg";
import { config } from "../config";
import {
  User,
  Restaurant,
  Plate,
  Order,
  OrderItem
} from "../models";

export const pgPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
});

export async function getUsers(): Promise<User[]> {
  const result = await pgPool.query(`
    SELECT
      id,
      first_name,
      last_name,
      email
    FROM "user"
  `);

  return result.rows;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const result = await pgPool.query(`
    SELECT
      id,
      name
    FROM restaurant
  `);

  return result.rows;
}

export async function getPlates(): Promise<Plate[]> {
  const result = await pgPool.query(`
    SELECT
      id,
      name,
      price
    FROM plate
  `);

  return result.rows;
}

export async function getOrders(): Promise<Order[]> {
  const result = await pgPool.query(`
    SELECT
      id,
      user_id,
      restaurant_id
    FROM "order"
  `);

  return result.rows;
}

export async function getOrderItems(): Promise<OrderItem[]> {
  const result = await pgPool.query(`
    SELECT
      order_id,
      plate_id
    FROM order_item
  `);

  return result.rows;
}

export async function closePostgres(): Promise<void> {
  await pgPool.end();
}