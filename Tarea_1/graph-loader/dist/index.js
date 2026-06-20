"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgres_loader_1 = require("./loaders/postgres-loader");
const neo_loader_1 = require("./loaders/neo-loader");
const neo4j_service_1 = require("./neo4j.service");
async function main() {
    try {
        const users = await (0, postgres_loader_1.getUsers)();
        const restaurants = await (0, postgres_loader_1.getRestaurants)();
        const plates = await (0, postgres_loader_1.getPlates)();
        const orders = await (0, postgres_loader_1.getOrders)();
        const items = await (0, postgres_loader_1.getOrderItems)();
        await (0, neo_loader_1.loadUsers)(users);
        await (0, neo_loader_1.loadRestaurants)(restaurants);
        await (0, neo_loader_1.loadPlates)(plates);
        await (0, neo_loader_1.loadOrders)(orders);
        await (0, neo_loader_1.createPlacedRelationships)(orders);
        await (0, neo_loader_1.createRestaurantRelationships)(orders);
        await (0, neo_loader_1.createContainsRelationships)(items);
        console.log("Graph load completed");
    }
    catch (error) {
        console.error(error);
    }
    finally {
        await (0, postgres_loader_1.closePostgres)();
        await (0, neo4j_service_1.closeNeo4j)();
    }
}
