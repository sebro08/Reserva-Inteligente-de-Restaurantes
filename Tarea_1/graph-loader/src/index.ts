import {
  getUsers,
  getRestaurants,
  getPlates,
  getOrders,
  getOrderItems,
  getLocations,
  closePostgres
} from "./loaders/postgres-loader";

import {
  getUsersMongo,
  getRestaurantsMongo,
  getPlatesMongo,
  getOrdersMongo,
  getOrderItemsMongo,
  getLocationsMongo,
  closeMongoLoader
} from "./loaders/mongo-loader";

import {
  loadUsers,
  loadRestaurants,
  loadPlates,
  loadOrders,
  loadLocations,
  createPlacedRelationships,
  createRestaurantRelationships,
  createContainsRelationships,
  createRestaurantLocationRelationships,
  createOrderLocationRelationships,
  seedDistances,
  seedRecommends,
  seedDeliverers
} from "./loaders/neo-loader";

import { closeNeo4j } from "./neo4j.service";

async function main() {
  const dbType = (process.env.DB_TYPE || "postgres").toLowerCase();

  console.log(`Iniciando carga del grafo (fuente: ${dbType})`);

  try {
    let users, restaurants, plates, orders, items, locations;

    if (dbType === "mongo" || dbType === "mongodb") {
      users = await getUsersMongo();
      restaurants = await getRestaurantsMongo();
      plates = await getPlatesMongo();
      orders = await getOrdersMongo();
      items = await getOrderItemsMongo();
      locations = await getLocationsMongo();
    } else {
      users = await getUsers();
      restaurants = await getRestaurants();
      plates = await getPlates();
      orders = await getOrders();
      items = await getOrderItems();
      locations = await getLocations();
    }

    await loadUsers(users);
    await loadRestaurants(restaurants);
    await loadPlates(plates);
    await loadOrders(orders);
    await loadLocations(locations);

    await createPlacedRelationships(orders);
    await createRestaurantRelationships(orders);
    await createContainsRelationships(items);

    await createRestaurantLocationRelationships(restaurants);
    await createOrderLocationRelationships(orders);

    await seedDistances();
    await seedRecommends();
    await seedDeliverers(3);

    console.log("Graph load completed");
  } catch (error) {
    console.error(error);
  } finally {
    await closePostgres();
    await closeMongoLoader();
    await closeNeo4j();
  }
}

main();