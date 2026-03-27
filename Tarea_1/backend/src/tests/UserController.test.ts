import { Request, Response } from "express";

// Mock ANTES de importar el controlador
const mockUserRepo = {
  findOneBy: jest.fn(),
  merge: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
};

jest.mock("../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepo)
  }
}));

import { UserController } from "../controller/UserController";

describe("UserController", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };

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

  // ─── GET ME ──────────────────────────────────────────────────────────────────

  describe("getMe", () => {
    it("should return 401 when kauth is not present", async () => {
      req.kauth = undefined;

      await UserController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No autorizado" });
    });

    it("should return 401 when kauth.grant is not present", async () => {
      req.kauth = {};

      await UserController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "No autorizado" });
    });

    it("should return 404 when user not found in local database", async () => {
      req.kauth = {
        grant: {
          access_token: {
            content: { sub: "keycloak-uuid-123" }
          }
        }
      };
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await UserController.getMe(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ keycloak_id: "keycloak-uuid-123" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Usuario no encontrado en la base de datos local"
      });
    });

    it("should return user when found", async () => {
      const user = { id: 1, name: "John", keycloak_id: "keycloak-uuid-123" };
      req.kauth = {
        grant: {
          access_token: {
            content: { sub: "keycloak-uuid-123" }
          }
        }
      };
      mockUserRepo.findOneBy.mockResolvedValue(user);

      await UserController.getMe(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ keycloak_id: "keycloak-uuid-123" });
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("should return 500 when findOneBy throws an error", async () => {
      req.kauth = {
        grant: {
          access_token: {
            content: { sub: "keycloak-uuid-123" }
          }
        }
      };
      mockUserRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await UserController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al obtener el usuario" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── UPDATE USER ─────────────────────────────────────────────────────────────

  describe("updateUser", () => {
    it("should return 404 when user not found", async () => {
      req.params.id = "999";
      req.body = { name: "New Name" };
      mockUserRepo.findOneBy.mockResolvedValue(null);

      await UserController.updateUser(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
    });

    it("should update and return user successfully", async () => {
      req.params.id = "1";
      req.body = { name: "Updated Name" };
      const existingUser = { id: 1, name: "Old Name" };
      const updatedUser = { id: 1, name: "Updated Name" };

      mockUserRepo.findOneBy.mockResolvedValue(existingUser);
      mockUserRepo.merge.mockImplementation(() => {});
      mockUserRepo.save.mockResolvedValue(updatedUser);

      await UserController.updateUser(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockUserRepo.merge).toHaveBeenCalledWith(existingUser, req.body);
      expect(mockUserRepo.save).toHaveBeenCalledWith(existingUser);
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should return 500 when findOneBy throws an error", async () => {
      req.params.id = "1";
      req.body = { name: "Updated Name" };
      mockUserRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al actualizar el usuario" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when save throws an error", async () => {
      req.params.id = "1";
      req.body = { name: "Updated Name" };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1, name: "Old Name" });
      mockUserRepo.merge.mockImplementation(() => {});
      mockUserRepo.save.mockRejectedValue(new Error("DB Error"));

      await UserController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al actualizar el usuario" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── DELETE USER ─────────────────────────────────────────────────────────────

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      req.params.id = "1";
      mockUserRepo.delete.mockResolvedValue({ affected: 1 });

      await UserController.deleteUser(req, res);

      expect(mockUserRepo.delete).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: "Usuario eliminado con éxito" });
    });

    it("should return 404 when user not found", async () => {
      req.params.id = "999";
      mockUserRepo.delete.mockResolvedValue({ affected: 0 });

      await UserController.deleteUser(req, res);

      expect(mockUserRepo.delete).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
    });

    it("should return 500 when delete throws an error", async () => {
      req.params.id = "1";
      mockUserRepo.delete.mockRejectedValue(new Error("DB Error"));

      await UserController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al eliminar el usuario" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
