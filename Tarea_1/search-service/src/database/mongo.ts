import { MongoClient, Db } from "mongodb";

export class MongoDatabase {
  private static client: MongoClient;
  private static db: Db;

  static async connect(): Promise<Db> {
    if (this.db) return this.db;

    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME;

    if (!mongoUri || !dbName) {
      throw new Error("Missing MONGO_URI or MONGO_DB_NAME");
    }

    this.client = new MongoClient(mongoUri);

    try {
      await this.client.connect();
      console.log("Connected to MongoDB");

      this.db = this.client.db(dbName);
      return this.db;
    } catch (error) {
      console.error("Mongo connection error:", error);
      throw error;
    }
  }

  static getDb(): Db {
    if (!this.db) {
      throw new Error("MongoDB not initialized. Call connect() first.");
    }
    return this.db;
  }
}