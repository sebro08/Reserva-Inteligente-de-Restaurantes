import neo4j from "neo4j-driver";
import { neo4jDriver } from "../neo4j.service";
import {
  User,
  Restaurant,
  Plate,
  Order,
  OrderItem,
  Location
} from "../models";

// Velocidad urbana promedio asumida para estimar tiempos de viaje (km/h).
const AVG_URBAN_SPEED_KMH = 25;
// Cuantos vecinos mas cercanos conecta cada ubicacion. Un valor bajo produce un
// grafo "disperso" (tipo red de carreteras) donde el camino entre dos puntos
// lejanos pasa por nodos intermedios -> Dijkstra/shortestPath se vuelve util.
const NEAREST_NEIGHBORS = 4;

// neo4j devuelve enteros como objetos Integer; los normalizamos a number de JS.
function toNum(value: any): number {
  return neo4j.isInt(value) ? value.toNumber() : Number(value);
}

// Distancia en km entre dos coordenadas (formula de Haversine).
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // radio terrestre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function loadUsers(users: User[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const user of users) {
      await session.run(
        `
        MERGE (u:User {id: $id})
        SET
          u.firstName = $firstName,
          u.lastName = $lastName,
          u.email = $email
        `,
        {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email
        }
      );
    }

    console.log(`Users cargados: ${users.length}`);
  } finally {
    await session.close();
  }
}

export async function loadRestaurants(restaurants: Restaurant[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const restaurant of restaurants) {
      await session.run(
        `
        MERGE (r:Restaurant {id: $id})
        SET r.name = $name
        `,
        {
          id: restaurant.id,
          name: restaurant.name
        }
      );
    }

    console.log(
      `Restaurants cargados: ${restaurants.length}`
    );
  } finally {
    await session.close();
  }
}

export async function loadPlates(plates: Plate[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const plate of plates) {
      await session.run(
        `
        MERGE (p:Plate {id: $id})
        SET
          p.name = $name,
          p.price = $price
        `,
        {
          id: plate.id,
          name: plate.name,
          price: plate.price
        }
      );
    }

    console.log(
      `Plates cargados: ${plates.length}`
    );
  } finally {
    await session.close();
  }
}

export async function loadOrders(orders: Order[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const order of orders) {
      await session.run(
        `
        MERGE (o:Order {id: $id})
        `,
        {
          id: order.id
        }
      );
    }

    console.log(
      `Orders cargadas: ${orders.length}`
    );
  } finally {
    await session.close();
  }
}

export async function createPlacedRelationships(orders: Order[]) {
    const session = neo4jDriver.session({
        database: "neo4j"
    });

    try {
        for (const order of orders) {
        await session.run(
            `
            MATCH (u:User {id:$userId})
            MATCH (o:Order {id:$orderId})

            MERGE (u)-[:PLACED]->(o)
            `,
            {
            userId: order.user_id,
            orderId: order.id
            }
        );
        }

        console.log(
        `PLACED creadas: ${orders.length}`
        );
    } finally {
        await session.close();
    }
}

export async function createRestaurantRelationships(orders: Order[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const order of orders) {
      await session.run(
        `
        MATCH (o:Order {id:$orderId})
        MATCH (r:Restaurant {id:$restaurantId})

        MERGE (o)-[:FROM]->(r)
        `,
        {
          orderId: order.id,
          restaurantId: order.restaurant_id
        }
      );
    }

    console.log(
      `FROM creadas: ${orders.length}`
    );
  } finally {
    await session.close();
  }
}

export async function createContainsRelationships(items: OrderItem[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const item of items) {
      await session.run(
        `
        MATCH (o:Order {id:$orderId})
        MATCH (p:Plate {id:$plateId})

        MERGE (o)-[:CONTAINS]->(p)
        `,
        {
          orderId: item.order_id,
          plateId: item.plate_id
        }
      );
    }

    console.log(
      `CONTAINS creadas: ${items.length}`
    );
  } finally {
    await session.close();
  }
}

export async function loadLocations(locations: Location[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const location of locations) {
      await session.run(
        `
        MERGE (l:Location {id: $id})
        SET
          l.name = $name,
          l.districtId = $districtId,
          l.latitude = $latitude,
          l.longitude = $longitude
        `,
        {
          id: location.id,
          name: location.name,
          districtId: location.district_id,
          latitude: location.latitude,
          longitude: location.longitude
        }
      );
    }

    console.log(`Locations cargadas: ${locations.length}`);
  } finally {
    await session.close();
  }
}

export async function createRestaurantLocationRelationships(restaurants: Restaurant[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const restaurant of restaurants) {
      await session.run(
        `
        MATCH (r:Restaurant {id:$restaurantId})
        MATCH (l:Location {id:$locationId})

        MERGE (r)-[:LOCATED_IN]->(l)
        `,
        {
          restaurantId: restaurant.id,
          locationId: restaurant.location_id
        }
      );
    }

    console.log(`LOCATED_IN (restaurant) creadas: ${restaurants.length}`);
  } finally {
    await session.close();
  }
}

export async function createOrderLocationRelationships(orders: Order[]) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (const order of orders) {
      await session.run(
        `
        MATCH (o:Order {id:$orderId})
        MATCH (l:Location {id:$locationId})

        MERGE (o)-[:DELIVERED_TO]->(l)
        `,
        {
          orderId: order.id,
          locationId: order.location_id
        }
      );
    }

    console.log(`DELIVERED_TO creadas: ${orders.length}`);
  } finally {
    await session.close();
  }
}

export async function seedDistances() {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    // Limpia distancias previas para que recargar sea idempotente (antes el
    // grafo era completo y aleatorio; ahora es disperso y geografico).
    await session.run(`MATCH ()-[d:DISTANCE]->() DELETE d`);

    const result = await session.run(`
      MATCH (l:Location)
      WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
      RETURN l.id AS id, l.latitude AS lat, l.longitude AS lon
    `);

    const locations = result.records.map((r) => ({
      id: toNum(r.get("id")),
      lat: Number(r.get("lat")),
      lon: Number(r.get("lon"))
    }));

    if (locations.length < 2) {
      console.warn(
        "No hay suficientes ubicaciones con coordenadas; se omiten las distancias."
      );
      return;
    }

    // Construye un grafo disperso: cada ubicacion se conecta solo con sus N
    // vecinos mas cercanos (por Haversine). Los pares se guardan sin direccion
    // (clave normalizada min-max) para no duplicar el calculo.
    const pairKey = (a: number, b: number) =>
      a < b ? `${a}-${b}` : `${b}-${a}`;

    const pairs = new Map<
      string,
      { idA: number; idB: number; km: number; minutes: number }
    >();

    for (const origin of locations) {
      const nearest = locations
        .filter((other) => other.id !== origin.id)
        .map((other) => ({
          other,
          km: haversineKm(origin.lat, origin.lon, other.lat, other.lon)
        }))
        .sort((a, b) => a.km - b.km)
        .slice(0, NEAREST_NEIGHBORS);

      for (const { other, km } of nearest) {
        const key = pairKey(origin.id, other.id);
        if (!pairs.has(key)) {
          const minutes = Math.max(
            1,
            Math.round((km / AVG_URBAN_SPEED_KMH) * 60)
          );
          pairs.set(key, {
            idA: origin.id,
            idB: other.id,
            km: +km.toFixed(2),
            minutes
          });
        }
      }
    }

    const pairList = Array.from(pairs.values());

    await session.run(
      `
      UNWIND $pairs AS pair
      MATCH (a:Location {id: pair.idA}), (b:Location {id: pair.idB})
      MERGE (a)-[d:DISTANCE]->(b)
      SET d.km = pair.km, d.minutes = pair.minutes
      MERGE (b)-[d2:DISTANCE]->(a)
      SET d2.km = pair.km, d2.minutes = pair.minutes
      `,
      { pairs: pairList }
    );

    console.log(
      `Distancias Haversine creadas: ${pairList.length} aristas entre ${locations.length} ubicaciones (k=${NEAREST_NEIGHBORS})`
    );
  } finally {
    await session.close();
  }
}

export async function seedRecommends() {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    await session.run(`
      MATCH (u1:User)-[:PLACED]->(:Order)-[:CONTAINS]->(p:Plate)<-[:CONTAINS]-(:Order)<-[:PLACED]-(u2:User)
      WHERE u1.id < u2.id
      WITH u1, u2, count(DISTINCT p) AS sharedPlates
      WHERE sharedPlates >= 1
      MERGE (u1)-[r:RECOMMENDS]->(u2)
      SET r.weight = sharedPlates
      MERGE (u2)-[r2:RECOMMENDS]->(u1)
      SET r2.weight = sharedPlates
    `);

    console.log("Relaciones RECOMMENDS creadas");
  } finally {
    await session.close();
  }
}

export async function seedDeliverers(count: number = 3) {
  const session = neo4jDriver.session({
    database: "neo4j"
  });

  try {
    for (let i = 1; i <= count; i++) {
      await session.run(
        `
        MERGE (d:Deliverer {id: $id})
        SET d.name = $name
        `,
        {
          id: i,
          name: `Repartidor ${i}`
        }
      );
    }

    console.log(`Deliverers simulados creados: ${count}`);
  } finally {
    await session.close();
  }
}