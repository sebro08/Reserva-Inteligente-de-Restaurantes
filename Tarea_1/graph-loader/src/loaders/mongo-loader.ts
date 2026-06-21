import { MongoClient, Db } from "mongodb";
import { config } from "../config";
import {
  User,
  Restaurant,
  Plate,
  Order,
  OrderItem,
  Location
} from "../models";

let client: MongoClient;

async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(config.mongo.uri);
    await client.connect();
  }
  return client.db(config.mongo.database);
}

export async function getUsersMongo(): Promise<User[]> {
  const db = await getDb();

  const docs = await db.collection("users").find().toArray();

  return docs.map((doc) => ({
    id: doc.id,
    first_name: doc.first_name,
    last_name: doc.last_name,
    email: doc.email
  }));
}

export async function getRestaurantsMongo(): Promise<Restaurant[]> {
  const db = await getDb();

  const docs = await db.collection("restaurants").find().toArray();

  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    location_id: doc.location_id
  }));
}

export async function getPlatesMongo(): Promise<Plate[]> {
  const db = await getDb();

  const docs = await db.collection("plate").find().toArray();

  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    price: doc.price
  }));
}

export async function getOrdersMongo(): Promise<Order[]> {
  const db = await getDb();

  const docs = await db.collection("orders").find().toArray();

  return docs.map((doc) => ({
    id: doc.id,
    user_id: doc.user_id,
    restaurant_id: doc.restaurant_id,
    location_id: doc.location_id
  }));
}

// Aqui esta la diferencia clave: los items vienen EMBEBIDOS en cada orden,
// asi que hay que "desanidarlos" (similar al explode() que usa tu script de Spark)
// para producir el mismo formato plano (order_id, plate_id) que en Postgres.
export async function getOrderItemsMongo(): Promise<OrderItem[]> {
  const db = await getDb();

  const docs = await db.collection("orders").find().toArray();

  const items: OrderItem[] = [];

  for (const doc of docs) {
    const orderItems = doc.items || [];
    for (const item of orderItems) {
      items.push({
        order_id: doc.id,
        plate_id: item.plate_id
      });
    }
  }

  return items;
}

export async function getLocationsMongo(): Promise<Location[]> {
  const db = await getDb();

  const docs = await db.collection("locations").find().toArray();

  return docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    district_id: doc.district_id
  }));
}

export async function closeMongoLoader(): Promise<void> {
  if (client) {
    await client.close();
  }
}