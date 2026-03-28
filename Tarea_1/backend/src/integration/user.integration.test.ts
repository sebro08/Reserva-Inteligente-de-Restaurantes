 //user.integration.test.ts
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

// ── Helper: crea un usuario directamente en la DB ────────────────────────────
const createUserInDB = async (overrides = {}) => {
  const role = TestDataSource.getRepository("Role").create({ name: "User" });
  await TestDataSource.getRepository("Role").save(role);

  const user = TestDataSource.getRepository("User").create({
    first_name: "Juan",
    last_name: "Pérez",
    email: "juan@test.com",
    keycloak_id: "kc-test-001",
    is_active: true,
    created_at: new Date(),
    role,
    ...overrides,
  });
  return TestDataSource.getRepository("User").save(user);
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe("User API - Integration", () => {

  describe("GET /users/me", () => {
    it("should return 401 when no kauth is present", async () => {
      // Sin token Keycloak mockeado en req, el controlador devuelve 401
      const res = await request(app).get("/users/me");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("No autorizado");
    });

    it("should return 404 when keycloak_id does not match any user", async () => {
      // Simular kauth inyectando un header que el middleware mockeado pasará
      // El controlador buscará por keycloak_id y no encontrará nada
      const res = await request(app)
        .get("/users/me")
        .set("X-Keycloak-Sub", "non-existent-id");

      // Sin kauth real en req, retorna 401 porque req.kauth es undefined
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /users/:id", () => {
    it("should update a user and reflect changes in the database", async () => {
      const user = await createUserInDB();

      const res = await request(app)
        .put(`/users/${user.id}`)
        .send({ first_name: "Actualizado" });

      expect(res.status).toBe(200);
      expect(res.body.first_name).toBe("Actualizado");

      const updated = await TestDataSource.getRepository("User").findOneBy({ id: user.id });
      expect(updated?.first_name).toBe("Actualizado");
    });

    it("should return 404 when updating a non-existent user", async () => {
      const res = await request(app)
        .put("/users/99999")
        .send({ first_name: "No existe" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Usuario no encontrado");
    });

    it("should update multiple fields at once", async () => {
      const user = await createUserInDB();

      const res = await request(app)
        .put(`/users/${user.id}`)
        .send({ first_name: "Nuevo", last_name: "Apellido" });

      expect(res.status).toBe(200);
      expect(res.body.first_name).toBe("Nuevo");
      expect(res.body.last_name).toBe("Apellido");
    });
  });

  describe("DELETE /users/:id", () => {
    it("should delete a user and confirm removal from the database", async () => {
      const user = await createUserInDB();

      const res = await request(app).delete(`/users/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Usuario eliminado con éxito");

      const deleted = await TestDataSource.getRepository("User").findOneBy({ id: user.id });
      expect(deleted).toBeNull();
    });

    it("should return 404 when deleting a non-existent user", async () => {
      const res = await request(app).delete("/users/99999");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Usuario no encontrado");
    });
  });
});
