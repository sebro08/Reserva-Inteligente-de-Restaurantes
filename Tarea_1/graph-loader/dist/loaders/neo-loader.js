"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUsers = loadUsers;
exports.loadRestaurants = loadRestaurants;
exports.loadPlates = loadPlates;
exports.loadOrders = loadOrders;
exports.createPlacedRelationships = createPlacedRelationships;
exports.createRestaurantRelationships = createRestaurantRelationships;
exports.createContainsRelationships = createContainsRelationships;
const neo4j_service_1 = require("../neo4j.service");
async function loadUsers(users) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const user of users) {
            await session.run(`
        MERGE (u:User {id: $id})
        SET
          u.firstName = $firstName,
          u.lastName = $lastName,
          u.email = $email
        `, {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            });
        }
        console.log(`Users cargados: ${users.length}`);
    }
    finally {
        await session.close();
    }
}
async function loadRestaurants(restaurants) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const restaurant of restaurants) {
            await session.run(`
        MERGE (r:Restaurant {id: $id})
        SET r.name = $name
        `, {
                id: restaurant.id,
                name: restaurant.name
            });
        }
        console.log(`Restaurants cargados: ${restaurants.length}`);
    }
    finally {
        await session.close();
    }
}
async function loadPlates(plates) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const plate of plates) {
            await session.run(`
        MERGE (p:Plate {id: $id})
        SET
          p.name = $name,
          p.price = $price
        `, {
                id: plate.id,
                name: plate.name,
                price: plate.price
            });
        }
        console.log(`Plates cargados: ${plates.length}`);
    }
    finally {
        await session.close();
    }
}
async function loadOrders(orders) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const order of orders) {
            await session.run(`
        MERGE (o:Order {id: $id})
        `, {
                id: order.id
            });
        }
        console.log(`Orders cargadas: ${orders.length}`);
    }
    finally {
        await session.close();
    }
}
async function createPlacedRelationships(orders) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const order of orders) {
            await session.run(`
            MATCH (u:User {id:$userId})
            MATCH (o:Order {id:$orderId})

            MERGE (u)-[:PLACED]->(o)
            `, {
                userId: order.user_id,
                orderId: order.id
            });
        }
        console.log(`PLACED creadas: ${orders.length}`);
    }
    finally {
        await session.close();
    }
}
async function createRestaurantRelationships(orders) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const order of orders) {
            await session.run(`
        MATCH (o:Order {id:$orderId})
        MATCH (r:Restaurant {id:$restaurantId})

        MERGE (o)-[:FROM]->(r)
        `, {
                orderId: order.id,
                restaurantId: order.restaurant_id
            });
        }
        console.log(`FROM creadas: ${orders.length}`);
    }
    finally {
        await session.close();
    }
}
async function createContainsRelationships(items) {
    const session = neo4j_service_1.neo4jDriver.session({
        database: "neo4j"
    });
    try {
        for (const item of items) {
            await session.run(`
        MATCH (o:Order {id:$orderId})
        MATCH (p:Plate {id:$plateId})

        MERGE (o)-[:CONTAINS]->(p)
        `, {
                orderId: item.order_id,
                plateId: item.plate_id
            });
        }
        console.log(`CONTAINS creadas: ${items.length}`);
    }
    finally {
        await session.close();
    }
}
