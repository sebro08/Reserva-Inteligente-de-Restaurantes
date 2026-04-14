import { MongoClient, Db } from "mongodb";

export class MongoDatabase {
  private static client: MongoClient;
  private static db: Db;

  static async connect(): Promise<Db> {
    if (this.db) return this.db;

    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME;

    if (!mongoUri || !dbName) {
      throw new Error("Missing MONGO_URI or MONGO_DB_NAME in environment variables.");
    }

    this.client = new MongoClient(mongoUri);

    try {
      await this.client.connect();
      console.log("Connected successfully to MongoDB router");
      this.db = this.client.db(dbName);
      return this.db;
    } catch (error) {
      console.error("Could not connect to MongoDB:", error);
      throw error;
    }
  }

  static getDb(): Db {
    if (!this.db) {
      throw new Error("Call MongoDatabase.connect() before getting the database.");
    }
    return this.db;
  }
}