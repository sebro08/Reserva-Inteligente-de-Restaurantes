import { DataSource } from "typeorm";
import "reflect-metadata";
import path from "path";

export const TestDataSource = new DataSource({
  type: "better-sqlite3",
  database: ":memory:",
  synchronize: true,
  dropSchema: false,
  logging: false,
  entities: [path.join(__dirname, "../model/**/*.{ts,js}")],
});