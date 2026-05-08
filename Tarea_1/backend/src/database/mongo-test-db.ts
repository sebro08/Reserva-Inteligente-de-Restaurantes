import { DataSource } from "typeorm";
import "reflect-metadata";
import path from "path";

export const TestMongoDataSource = new DataSource({
  type: "mongodb",
  url: "mongodb://localhost:27017",
  database: "test_db",
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, "../model/**/*.{ts,js}")],
});