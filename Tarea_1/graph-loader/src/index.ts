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
  try {
    // 1. Extraer de Postgres
    const users = await getUsers();
    const restaurants = await getRestaurants();
    const plates = await getPlates();
    const orders = await getOrders();
    const items = await getOrderItems();
    const locations = await getLocations();

    // 2. Cargar nodos base
    await loadUsers(users);
    await loadRestaurants(restaurants);
    await loadPlates(plates);
    await loadOrders(orders);
    await loadLocations(locations);

    // 3. Crear relaciones base
    await createPlacedRelationships(orders);
    await createRestaurantRelationships(orders);
    await createContainsRelationships(items);

    // 4. Relaciones de ubicación
    await createRestaurantLocationRelationships(restaurants);
    await createOrderLocationRelationships(orders);

    // 5. Relaciones derivadas/simuladas
    await seedDistances();
    await seedRecommends();
    await seedDeliverers(3);

    console.log("Graph load completed");
  } catch (error) {
    console.error(error);
  } finally {
    await closePostgres();
    await closeNeo4j();
  }
}

main();