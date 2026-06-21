"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgPool = void 0;
exports.getUsers = getUsers;
exports.getRestaurants = getRestaurants;
exports.getPlates = getPlates;
exports.getOrders = getOrders;
exports.getOrderItems = getOrderItems;
exports.closePostgres = closePostgres;
const pg_1 = require("pg");
const config_1 = require("../config");
exports.pgPool = new pg_1.Pool({
    host: config_1.config.postgres.host,
    port: config_1.config.postgres.port,
    user: config_1.config.postgres.user,
    password: config_1.config.postgres.password,
    database: config_1.config.postgres.database,
});
async function getUsers() {
    const result = await exports.pgPool.query(`
    SELECT
      id,
      first_name,
      last_name,
      email
    FROM "user"
  `);
    return result.rows;
}
async function getRestaurants() {
    const result = await exports.pgPool.query(`
    SELECT
      id,
      name
    FROM restaurant
  `);
    return result.rows;
}
async function getPlates() {
    const result = await exports.pgPool.query(`
    SELECT
      id,
      name,
      price
    FROM plate
  `);
    return result.rows;
}
async function getOrders() {
    const result = await exports.pgPool.query(`
    SELECT
      id,
      user_id,
      restaurant_id
    FROM "order"
  `);
    return result.rows;
}
async function getOrderItems() {
    const result = await exports.pgPool.query(`
    SELECT
      order_id,
      plate_id
    FROM order_item
  `);
    return result.rows;
}
async function closePostgres() {
    await exports.pgPool.end();
}
