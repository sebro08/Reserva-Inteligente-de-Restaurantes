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
describe("Restaurant API - Integration", () => {

  describe("POST /restaurants", () => {
    it("should create a restaurant and persist it in the database", async () => {
      const res = await request(app)
        .post("/restaurants")
        .send({ name: "El Rancho" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("El Rancho");

      const saved = await TestDataSource.getRepository("Restaurant").findOneBy({ id: res.body.id });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe("El Rancho");
    });

    it("should create a restaurant with a valid admin", async () => {
      const role = TestDataSource.getRepository("Role").create({ name: "Admin" });
      await TestDataSource.getRepository("Role").save(role);

      const admin = TestDataSource.getRepository("User").create({
        first_name: "Admin",
        last_name: "User",
        email: "admin@test.com",
        keycloak_id: "kc-admin-001",
        is_active: true,
        created_at: new Date(),
        role,
      });
      await TestDataSource.getRepository("User").save(admin);

      const res = await request(app)
        .post("/restaurants")
        .send({ name: "Restaurante con Admin", admin_id: admin.id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Restaurante con Admin");
    });

    it("should create a restaurant with non-existent admin_id gracefully", async () => {
      const res = await request(app)
        .post("/restaurants")
        .send({ name: "Sin Admin", admin_id: 99999 });

      // El controlador no falla, simplemente no asigna admin
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Sin Admin");
    });
  });

  describe("GET /restaurants", () => {
    it("should return an empty array when no restaurants exist", async () => {
      const res = await request(app).get("/restaurants");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all restaurants from the database", async () => {
      await request(app).post("/restaurants").send({ name: "Restaurante A" });
      await request(app).post("/restaurants").send({ name: "Restaurante B" });

      const res = await request(app).get("/restaurants");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((r: any) => r.name)).toContain("Restaurante A");
      expect(res.body.map((r: any) => r.name)).toContain("Restaurante B");
    });

    it("should return restaurants with location and admin relations", async () => {
      await request(app).post("/restaurants").send({ name: "Con Relaciones" });

      const res = await request(app).get("/restaurants");

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("location");
      expect(res.body[0]).toHaveProperty("admin");
    });
  });
});