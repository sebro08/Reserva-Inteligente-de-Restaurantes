import {getUsers,getRestaurants,getPlates,getOrders,closePostgres,getOrderItems} from "./loaders/postgres-loader";

import {loadUsers,loadRestaurants,loadPlates,loadOrders,createPlacedRelationships,
        createRestaurantRelationships,createContainsRelationships} from "./loaders/neo-loader";

import { closeNeo4j } from "./neo4j.service";

async function main() {
  try {
    const users = await getUsers();
    const restaurants = await getRestaurants();
    const plates = await getPlates();
    const orders = await getOrders();
    const items = await getOrderItems();

    await loadUsers(users);
    await loadRestaurants(restaurants);
    await loadPlates(plates);
    await loadOrders(orders);

    await createPlacedRelationships(orders);
    await createRestaurantRelationships(orders);
    await createContainsRelationships(items);

    console.log("Graph load completed");
  } catch (error) {
    console.error(error);
  } finally {
    await closePostgres();
    await closeNeo4j();
  }
}