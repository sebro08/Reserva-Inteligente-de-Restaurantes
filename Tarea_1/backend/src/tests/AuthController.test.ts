import { Request, Response } from "express";
 
// Mocks ANTES de importar el controlador
const mockUserRepo = {
  save: jest.fn()
};
 
const mockRoleRepo = {
  findOneBy: jest.fn()
};
 
jest.mock("../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity.name === "Role") return mockRoleRepo;
      return mockUserRepo;
    })
  }
}));
 
jest.mock("axios");
import axios from "axios";
const mockedAxios = axios as jest.Mocked<typeof axios>;
 
import { AuthController } from "../controller/AuthController";
 
describe("AuthController", () => {
  let req: any;
  let res: any;
 
  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
 
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
 
  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });
 
  // Helper: simula el flujo completo de Keycloak exitoso
  const mockKeycloakSuccess = (keycloakId = "kc-uuid-abc") => {
    // 1. getAdminToken
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "admin-token-xyz" } });
    // 2. Crear usuario en Keycloak
    mockedAxios.post.mockResolvedValueOnce({ data: {} });
    // 3. Obtener keycloak_id del usuario creado
    mockedAxios.get.mockResolvedValueOnce({ data: [{ id: keycloakId }] });
    // 4. Obtener definición del rol en Keycloak
    mockedAxios.get.mockResolvedValueOnce({ data: { id: "role-id", name: "cliente_restaurante" } });
    // 5. Asignar rol al usuario
    mockedAxios.post.mockResolvedValueOnce({ data: {} });
  };
 
  // ─── REGISTER ────────────────────────────────────────────────────────────────
 
  describe("register", () => {
    it("should return 400 when required fields are missing", async () => {
      req.body = { first_name: "John" };
 
      await AuthController.register(req, res);
 
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Faltan campos requeridos (first_name, last_name, email, password)"
      });
    });
 
    it("should return 400 when first_name is missing", async () => {
      req.body = { last_name: "Doe", email: "john@test.com", password: "pass" };
 
      await AuthController.register(req, res);
 
      expect(res.status).toHaveBeenCalledWith(400);
    });
 
    it("should return 400 when role does not exist in local DB (default role cliente_restaurante -> User)", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "pass123"
      };
      mockRoleRepo.findOneBy.mockResolvedValue(null);
 
      await AuthController.register(req, res);
 
      expect(mockRoleRepo.findOneBy).toHaveBeenCalledWith({ name: "User" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "El rol User no existe en la base de datos local."
      });
    });
 
    it("should return 400 when role admin_restaurante does not exist in local DB", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "pass123",
        role_name: "admin_restaurante"
      };
      mockRoleRepo.findOneBy.mockResolvedValue(null);
 
      await AuthController.register(req, res);
 
      expect(mockRoleRepo.findOneBy).toHaveBeenCalledWith({ name: "Admin" });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "El rol Admin no existe en la base de datos local."
      });
    });
 
    it("should register user successfully with default role (cliente_restaurante)", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "pass123"
      };
      const roleObj = { id: 2, name: "User" };
      mockRoleRepo.findOneBy.mockResolvedValue(roleObj);
      mockKeycloakSuccess("kc-uuid-001");
      mockUserRepo.save.mockResolvedValue({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        keycloak_id: "kc-uuid-001"
      });
 
      await AuthController.register(req, res);
 
      expect(mockRoleRepo.findOneBy).toHaveBeenCalledWith({ name: "User" });
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Usuario creado y sincronizado con éxito" })
      );
    });
 
    it("should register user successfully with role admin_restaurante", async () => {
      req.body = {
        first_name: "Admin",
        last_name: "User",
        email: "admin@test.com",
        password: "adminpass",
        role_name: "admin_restaurante"
      };
      const roleObj = { id: 1, name: "Admin" };
      mockRoleRepo.findOneBy.mockResolvedValue(roleObj);
      mockKeycloakSuccess("kc-uuid-admin");
      mockUserRepo.save.mockResolvedValue({ id: 2, email: "admin@test.com" });
 
      await AuthController.register(req, res);
 
      expect(mockRoleRepo.findOneBy).toHaveBeenCalledWith({ name: "Admin" });
      expect(res.status).toHaveBeenCalledWith(201);
    });
 
    it("should register user even when Keycloak role assignment fails (inner try/catch)", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "pass123"
      };
      mockRoleRepo.findOneBy.mockResolvedValue({ id: 2, name: "User" });
 
      // 1. getAdminToken
      mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
      // 2. Crear usuario en Keycloak
      mockedAxios.post.mockResolvedValueOnce({ data: {} });
      // 3. Obtener keycloak_id
      mockedAxios.get.mockResolvedValueOnce({ data: [{ id: "kc-uuid-002" }] });
      // 4. Obtener rol en Keycloak -> FALLA (inner catch)
      mockedAxios.get.mockRejectedValueOnce(new Error("Role not found in Keycloak"));
 
      mockUserRepo.save.mockResolvedValue({ id: 1, email: "john@test.com" });
 
      await AuthController.register(req, res);
 
      // A pesar del fallo interno, el registro continúa
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Advertencia"),
        expect.any(Error)
      );
    });
 
    it("should return 409 when Keycloak responds with conflict (user already exists)", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "existing@test.com",
        password: "pass123"
      };
      mockRoleRepo.findOneBy.mockResolvedValue({ id: 2, name: "User" });
 
      // 1. getAdminToken
      mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "admin-token" } });
      // 2. Crear usuario en Keycloak -> 409 conflict
      const conflictError: any = new Error("Conflict");
      conflictError.response = { status: 409, data: { errorMessage: "User exists with same username" } };
      mockedAxios.post.mockRejectedValueOnce(conflictError);
 
      await AuthController.register(req, res);
 
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "El usuario ya existe (el correo ya está registrado)"
      });
    });
 
    it("should return 500 when getAdminToken fails", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "pass123"
      };
      mockRoleRepo.findOneBy.mockResolvedValue({ id: 2, name: "User" });
      mockedAxios.post.mockRejectedValueOnce(new Error("Keycloak unreachable"));
 
      await AuthController.register(req, res);
 
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error interno en el registro del usuario"
      });
      expect(console.error).toHaveBeenCalled();
    });
 
    it("should return 500 when userRepository.save fails", async () => {
      req.body = {
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        password: "pass123"
      };
      mockRoleRepo.findOneBy.mockResolvedValue({ id: 2, name: "User" });
      mockKeycloakSuccess();
      mockUserRepo.save.mockRejectedValue(new Error("DB Error"));
 
      await AuthController.register(req, res);
 
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error interno en el registro del usuario"
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
 
  // ─── LOGIN ───────────────────────────────────────────────────────────────────
 
  describe("login", () => {
    it("should return 400 when email is missing", async () => {
      req.body = { password: "pass123" };
 
      await AuthController.login(req, res);
 
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Faltan credenciales" });
    });
 
    it("should return 400 when password is missing", async () => {
      req.body = { email: "john@test.com" };
 
      await AuthController.login(req, res);
 
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Faltan credenciales" });
    });
 
    it("should return 400 when both email and password are missing", async () => {
      req.body = {};
 
      await AuthController.login(req, res);
 
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Faltan credenciales" });
    });
 
    it("should login successfully and return tokens", async () => {
      req.body = { email: "john@test.com", password: "pass123" };
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: "jwt-access-token",
          refresh_token: "jwt-refresh-token",
          expires_in: 3600
        }
      });
 
      await AuthController.login(req, res);
 
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("openid-connect/token"),
        expect.any(URLSearchParams),
        expect.objectContaining({ headers: { "Content-Type": "application/x-www-form-urlencoded" } })
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Login exitoso",
        access_token: "jwt-access-token",
        refresh_token: "jwt-refresh-token",
        expires_in: 3600
      });
    });
 
    it("should return 401 when Keycloak returns 401 (invalid credentials)", async () => {
      req.body = { email: "john@test.com", password: "wrong-password" };
      const authError: any = new Error("Unauthorized");
      authError.response = { status: 401, data: { error: "invalid_grant" } };
      mockedAxios.post.mockRejectedValueOnce(authError);
 
      await AuthController.login(req, res);
 
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Credenciales inválidas" });
    });
 
    it("should return 500 when Keycloak returns an unexpected error", async () => {
      req.body = { email: "john@test.com", password: "pass123" };
      const serverError: any = new Error("Internal Server Error");
      serverError.response = { status: 500, data: { error: "server_error" } };
      mockedAxios.post.mockRejectedValueOnce(serverError);
 
      await AuthController.login(req, res);
 
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error interno al iniciar sesión" });
      expect(console.error).toHaveBeenCalled();
    });
 
    it("should return 500 when axios throws without response (network error)", async () => {
      req.body = { email: "john@test.com", password: "pass123" };
      mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));
 
      await AuthController.login(req, res);
 
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error interno al iniciar sesión" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});