import request from "supertest";
import { TestDataSource } from "../database/data-source.test";

// ── Mockear AppDataSource con TestDataSource ─────────────────────────────────
jest.mock("../database/data-source", () => ({
  AppDataSource: TestDataSource,
}));

// ── Mockear Keycloak middleware antes de importar la app ─────────────────────
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

// ── Mockear axios (Keycloak Admin API) ───────────────────────────────────────
jest.mock("axios");
import axios from "axios";
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
  jest.clearAllMocks();
  for (const entity of TestDataSource.entityMetadatas) {
  const repository = TestDataSource.getRepository(entity.target);
  await repository.clear();
}
});

// ── Helper: simula respuestas de Keycloak Admin ──────────────────────────────
const mockKeycloakRegisterSuccess = (keycloakId = "kc-integration-001") => {
  mockedAxios.post
    .mockResolvedValueOnce({ data: { access_token: "admin-token" } }) // getAdminToken
    .mockResolvedValueOnce({ data: {} })                               // crear usuario
    .mockResolvedValueOnce({ data: {} });                              // asignar rol
  mockedAxios.get
    .mockResolvedValueOnce({ data: [{ id: keycloakId }] })            // obtener keycloak_id
    .mockResolvedValueOnce({ data: { id: "role-id", name: "cliente_restaurante" } }); // obtener rol
};

// ── Tests ────────────────────────────────────────────────────────────────────
describe("Auth API - Integration", () => {

  describe("POST /auth/register", () => {
    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: "sin@campos.com" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Faltan campos requeridos");
    });

    it("should return 400 when role does not exist in local DB", async () => {
      // No hay roles en la DB, así que fallará la validación del rol
      const res = await request(app)
        .post("/auth/register")
        .send({
          first_name: "Juan",
          last_name: "Pérez",
          email: "juan@test.com",
          password: "pass123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("no existe en la base de datos local");
    });

    it("should register a user and persist it in the database", async () => {
      // Crear el rol en la DB local primero
      const role = TestDataSource.getRepository("Role").create({ name: "User" });
      await TestDataSource.getRepository("Role").save(role);

      mockKeycloakRegisterSuccess("kc-new-user-001");

      const res = await request(app)
        .post("/auth/register")
        .send({
          first_name: "Juan",
          last_name: "Pérez",
          email: "juan@test.com",
          password: "pass123",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Usuario creado y sincronizado con éxito");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe("juan@test.com");

      // Verificar persistencia real en la DB
      const saved = await TestDataSource.getRepository("User").findOneBy({ email: "juan@test.com" });
      expect(saved).not.toBeNull();
      expect(saved?.keycloak_id).toBe("kc-new-user-001");
      expect(saved?.first_name).toBe("Juan");
    });

    it("should register a user with admin role", async () => {
      const role = TestDataSource.getRepository("Role").create({ name: "Admin" });
      await TestDataSource.getRepository("Role").save(role);

      mockKeycloakRegisterSuccess("kc-admin-user-001");

      const res = await request(app)
        .post("/auth/register")
        .send({
          first_name: "Admin",
          last_name: "User",
          email: "admin@test.com",
          password: "adminpass",
          role_name: "admin_restaurante",
        });

      expect(res.status).toBe(201);
      const saved = await TestDataSource.getRepository("User").findOneBy({ email: "admin@test.com" });
      expect(saved).not.toBeNull();
    });

    it("should return 409 when Keycloak reports user already exists", async () => {
      const role = TestDataSource.getRepository("Role").create({ name: "User" });
      await TestDataSource.getRepository("Role").save(role);

      // getAdminToken ok, luego 409 al crear usuario
      mockedAxios.post
        .mockResolvedValueOnce({ data: { access_token: "admin-token" } });
      const conflict: any = new Error("Conflict");
      conflict.response = { status: 409 };
      mockedAxios.post.mockRejectedValueOnce(conflict);

      const res = await request(app)
        .post("/auth/register")
        .send({
          first_name: "Juan",
          last_name: "Pérez",
          email: "existing@test.com",
          password: "pass123",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("ya existe");
    });
  });

  describe("POST /auth/login", () => {
    it("should return 400 when credentials are missing", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "juan@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Faltan credenciales");
    });

    it("should return 400 when both fields are missing", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({});

      expect(res.status).toBe(400);
    });

    it("should login successfully and return tokens", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: "jwt-access",
          refresh_token: "jwt-refresh",
          expires_in: 3600,
        },
      });

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "juan@test.com", password: "pass123" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login exitoso");
      expect(res.body).toHaveProperty("access_token", "jwt-access");
      expect(res.body).toHaveProperty("refresh_token", "jwt-refresh");
      expect(res.body).toHaveProperty("expires_in", 3600);
    });

    it("should return 401 when Keycloak rejects credentials", async () => {
      const authError: any = new Error("Unauthorized");
      authError.response = { status: 401 };
      mockedAxios.post.mockRejectedValueOnce(authError);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "juan@test.com", password: "wrong" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Credenciales inválidas");
    });

    it("should return 500 on unexpected Keycloak error", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "juan@test.com", password: "pass123" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Error interno al iniciar sesión");
    });
  });
});