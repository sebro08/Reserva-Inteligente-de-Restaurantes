import { neo4jDriver } from "../neo4j.service";
import {
  User,
  Restaurant,
  Plate,
  Order,
  OrderItem,
  Location
} from "../models";

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
          l.districtId = $districtId
        `,
        {
          id: location.id,
          name: location.name,
          districtId: location.district_id
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
    const result = await session.run(`
      MATCH (l:Location)
      RETURN l.id AS id
    `);

    const ids = result.records.map((r) => r.get("id"));

    const pairs: { idA: number; idB: number; km: number; minutes: number }[] = [];

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const km = +(Math.random() * 20 + 1).toFixed(2);
        const minutes = Math.round(km * 2.5);
        pairs.push({ idA: ids[i], idB: ids[j], km, minutes });
      }
    }

    await session.run(
      `
      UNWIND $pairs AS pair
      MATCH (a:Location {id: pair.idA}), (b:Location {id: pair.idB})
      MERGE (a)-[d:DISTANCE]->(b)
      SET d.km = pair.km, d.minutes = pair.minutes
      MERGE (b)-[d2:DISTANCE]->(a)
      SET d2.km = pair.km, d2.minutes = pair.minutes
      `,
      { pairs }
    );

    console.log(`Distancias creadas entre ${ids.length} ubicaciones (${pairs.length} pares)`);
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