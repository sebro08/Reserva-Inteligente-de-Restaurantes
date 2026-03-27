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
describe("Reservation API - Integration", () => {

  const baseReservation = {
    reservation_date: "2025-12-25",
    reservation_time: "20:00",
    people_count: 4,
  };

  describe("POST /reservations", () => {
    it("should create a reservation and persist it in the database", async () => {
      const res = await request(app)
        .post("/reservations")
        .send(baseReservation);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.people_count).toBe(4);
      expect(res.body.reservation_time).toBe("20:00");

      const saved = await TestDataSource.getRepository("Reservation").findOneBy({ id: res.body.id });
      expect(saved).not.toBeNull();
      expect(saved?.people_count).toBe(4);
    });

    it("should create a reservation with a valid user", async () => {
      const role = TestDataSource.getRepository("Role").create({ name: "User" });
      await TestDataSource.getRepository("Role").save(role);

      const user = TestDataSource.getRepository("User").create({
        first_name: "Ana",
        last_name: "López",
        email: "ana@test.com",
        keycloak_id: "kc-002",
        is_active: true,
        created_at: new Date(),
        role,
      });
      await TestDataSource.getRepository("User").save(user);

      const res = await request(app)
        .post("/reservations")
        .send({ ...baseReservation, user_id: user.id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("should create a reservation with a valid restaurant", async () => {
      const restaurant = TestDataSource.getRepository("Restaurant").create({
        name: "La Trattoria",
        created_at: new Date(),
      });
      await TestDataSource.getRepository("Restaurant").save(restaurant);

      const res = await request(app)
        .post("/reservations")
        .send({ ...baseReservation, restaurant_id: restaurant.id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    it("should create a reservation with both user and restaurant", async () => {
      const role = TestDataSource.getRepository("Role").create({ name: "User" });
      await TestDataSource.getRepository("Role").save(role);

      const user = TestDataSource.getRepository("User").create({
        first_name: "Carlos",
        last_name: "Mora",
        email: "carlos@test.com",
        keycloak_id: "kc-003",
        is_active: true,
        created_at: new Date(),
        role,
      });
      await TestDataSource.getRepository("User").save(user);

      const restaurant = TestDataSource.getRepository("Restaurant").create({
        name: "Soda Tapia",
        created_at: new Date(),
      });
      await TestDataSource.getRepository("Restaurant").save(restaurant);

      const res = await request(app)
        .post("/reservations")
        .send({ ...baseReservation, user_id: user.id, restaurant_id: restaurant.id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("DELETE /reservations/:id", () => {
    it("should delete a reservation and confirm removal from the database", async () => {
      const created = await request(app)
        .post("/reservations")
        .send(baseReservation);

      const res = await request(app).delete(`/reservations/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Reserva cancelada con éxito");

      const deleted = await TestDataSource.getRepository("Reservation").findOneBy({ id: created.body.id });
      expect(deleted).toBeNull();
    });

    it("should return 404 when deleting a non-existent reservation", async () => {
      const res = await request(app).delete("/reservations/99999");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Reserva no encontrada");
    });
  });
});