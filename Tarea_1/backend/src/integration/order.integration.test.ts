//order.integration.test.ts
import request from "supertest";
import { TestDataSource } from "../database/data-source.test";

// Mock Keycloak
jest.mock("../middleware/keycloak", () => {
  const EventEmitter = require("events");
  const store = new EventEmitter();
  store.get = jest.fn((_sid: string, cb: Function) => cb(null, null));
  store.set = jest.fn((_sid: string, _session: any, cb: Function) => cb(null));
  store.destroy = jest.fn((_sid: string, cb: Function) => cb(null));
  return {
    memoryStore: store,
    keycloak: {
      middleware: () => (_req: any, _res: any, next: any) => next(),
      protect: () => (_req: any, _res: any, next: any) => next(),
    },
  };
});

// Mock con require() interno
jest.mock("../database/data-source", () => {
  const { TestDataSource } = require("../database/data-source.test");
  return { AppDataSource: TestDataSource };
});

import { app } from "../index";

beforeAll(async () => {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
});

afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});

afterEach(async () => {
  const queryRunner = TestDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.query("PRAGMA foreign_keys = OFF");
  for (const entity of TestDataSource.entityMetadatas) {
    await queryRunner.query(`DELETE FROM "${entity.tableName}"`);
  }
  await queryRunner.query("PRAGMA foreign_keys = ON");
  await queryRunner.release();
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe("Order API - Integration", () => {

  describe("POST /orders", () => {
    it("should create an order and persist it in the database", async () => {
      const res = await request(app)
        .post("/orders")
        .send({ pickup: true });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.pickup).toBe(true);

      const saved = await TestDataSource.getRepository("Order").findOneBy({ id: res.body.id });
      expect(saved).not.toBeNull();
    });

    it("should create an order with pickup false", async () => {
      const res = await request(app)
        .post("/orders")
        .send({ pickup: false });

      expect(res.status).toBe(201);
      expect(res.body.pickup).toBe(false);
    });

    it("should create an order with a valid user", async () => {
      // Crear usuario y rol primero
      const role = TestDataSource.getRepository("Role").create({ name: "User" });
      await TestDataSource.getRepository("Role").save(role);

      const user = TestDataSource.getRepository("User").create({
        first_name: "Juan",
        last_name: "Pérez",
        email: "juan@test.com",
        keycloak_id: "kc-001",
        is_active: true,
        created_at: new Date(),
        role,
      });
      await TestDataSource.getRepository("User").save(user);

      const res = await request(app)
        .post("/orders")
        .send({ user_id: user.id, pickup: true });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("should create an order with a valid restaurant", async () => {
      const restaurant = TestDataSource.getRepository("Restaurant").create({
        name: "El Rancho",
        created_at: new Date(),
      });
      await TestDataSource.getRepository("Restaurant").save(restaurant);

      const res = await request(app)
        .post("/orders")
        .send({ restaurant_id: restaurant.id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("GET /orders/:id", () => {
    it("should retrieve an existing order from the database", async () => {
      const created = await request(app)
        .post("/orders")
        .send({ pickup: true });

      const res = await request(app).get(`/orders/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it("should return 404 for a non-existent order", async () => {
      const res = await request(app).get("/orders/99999");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Pedido no encontrado");
    });
  });
});
