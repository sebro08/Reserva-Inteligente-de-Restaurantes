import { TestMongoDataSource } from "./database/mongo-test-db";

beforeAll(async () => {
  const dbType = process.env.DB_TYPE;

  if (dbType === "mongodb") {
    await TestMongoDataSource.initialize();
  }
});

afterAll(async () => {
  const dbType = process.env.DB_TYPE;

  if (dbType === "mongodb") {
    await TestMongoDataSource.destroy();
  }
});