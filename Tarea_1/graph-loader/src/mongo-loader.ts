import { MongoClient, Db } from "mongodb";
import { config } from "./config";

let client: MongoClient;

export async function connectMongo(): Promise<Db> {
  client = new MongoClient(config.mongo.uri);

  await client.connect();

  console.log("Mongo conectado");

  return client.db(
    process.env.MONGO_DB_NAME
  );
}

export async function testMongo(): Promise<void> {
  const db = await connectMongo();

  const count = await db
    .collection("restaurants")
    .countDocuments();

  console.log(
    "Mongo conectado. Restaurantes:",
    count
  );
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
  }
}