import request from "supertest";
import { TestDataSource } from "../database/data-source.test";

// ── Mockear Keycloak antes de importar la app ────────────────────────────────
// memoryStore con .on() que express-session necesita
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

// ── Mockear AppDataSource con TestDataSource ─────────────────────────────────
jest.mock("../database/data-source", () => ({
  AppDataSource: TestDataSource,
}));

import { app } from "../index";

// ── Setup / Teardown ─────────────────────────────────────────────────────────
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
  const entities = TestDataSource.entityMetadatas;
  for (const entity of TestDataSource.entityMetadatas) {
  const repository = TestDataSource.getRepository(entity.target);
  await repository.clear();
}
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe("Menu API - Integration", () => {

  describe("POST /menus", () => {
    it("should create a menu and persist it in the database", async () => {
      const res = await request(app)
        .post("/menus")
        .send({ name: "Menú del día" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Menú del día");

      const saved = await TestDataSource.getRepository("Menu").findOneBy({ id: res.body.id });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe("Menú del día");
    });

    it("should create a menu without restaurant_id", async () => {
      const res = await request(app)
        .post("/menus")
        .send({ name: "Menú simple" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Menú simple");
    });
  });

  describe("GET /menus/:id", () => {
    it("should retrieve an existing menu from the database", async () => {
      const created = await request(app)
        .post("/menus")
        .send({ name: "Menú para obtener" });

      const res = await request(app).get(`/menus/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.name).toBe("Menú para obtener");
    });

    it("should return 404 for a non-existent menu", async () => {
      const res = await request(app).get("/menus/99999");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Menú no encontrado");
    });
  });

  describe("PUT /menus/:id", () => {
    it("should update a menu and reflect changes in the database", async () => {
      const created = await request(app)
        .post("/menus")
        .send({ name: "Nombre original" });

      const res = await request(app)
        .put(`/menus/${created.body.id}`)
        .send({ name: "Nombre actualizado" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Nombre actualizado");

      const updated = await TestDataSource.getRepository("Menu").findOneBy({ id: created.body.id });
      expect(updated?.name).toBe("Nombre actualizado");
    });

    it("should return 404 when updating a non-existent menu", async () => {
      const res = await request(app)
        .put("/menus/99999")
        .send({ name: "No existe" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Menú no encontrado");
    });
  });

  describe("DELETE /menus/:id", () => {
    it("should delete a menu and confirm removal from the database", async () => {
      const created = await request(app)
        .post("/menus")
        .send({ name: "Menú a eliminar" });

      const res = await request(app).delete(`/menus/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Menú eliminado con éxito");

      const deleted = await TestDataSource.getRepository("Menu").findOneBy({ id: created.body.id });
      expect(deleted).toBeNull();
    });

    it("should return 404 when deleting a non-existent menu", async () => {
      const res = await request(app).delete("/menus/99999");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Menú no encontrado");
    });
  });
});