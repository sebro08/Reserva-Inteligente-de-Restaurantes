import { Request, Response } from "express";

// Mocks ANTES de importar el controlador
const mockMenuRepo = {
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn()
};

const mockRestaurantRepo = {
  findOneBy: jest.fn()
};

jest.mock("../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity.name === "Restaurant") return mockRestaurantRepo;
      return mockMenuRepo;
    })
  }
}));

import { MenuController } from "../controller/MenuController";

describe("MenuController", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { body: {}, params: {} };
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

  // ─── CREATE MENU ─────────────────────────────────────────────────────────────

  describe("createMenu", () => {
    it("should create menu successfully without restaurant", async () => {
      req.body = { name: "Menú del día" };
      mockMenuRepo.save.mockResolvedValue({ id: 1, name: "Menú del día" });

      await MenuController.createMenu(req, res);

      expect(mockMenuRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create menu with valid restaurant", async () => {
      req.body = { name: "Menú del día", restaurant_id: 1 };
      mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 1, name: "El Rancho" });
      mockMenuRepo.save.mockResolvedValue({ id: 1, name: "Menú del día", restaurant: { id: 1 } });

      await MenuController.createMenu(req, res);

      expect(mockRestaurantRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create menu when restaurant_id provided but restaurant not found", async () => {
      req.body = { name: "Menú del día", restaurant_id: 999 };
      mockRestaurantRepo.findOneBy.mockResolvedValue(null);
      mockMenuRepo.save.mockResolvedValue({ id: 1, name: "Menú del día" });

      await MenuController.createMenu(req, res);

      expect(mockRestaurantRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 500 when save throws an error", async () => {
      req.body = { name: "Menú del día" };
      mockMenuRepo.save.mockRejectedValue(new Error("DB Error"));

      await MenuController.createMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear el menú" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when restaurantRepo.findOneBy throws an error", async () => {
      req.body = { name: "Menú del día", restaurant_id: 1 };
      mockRestaurantRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await MenuController.createMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear el menú" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── GET MENU ────────────────────────────────────────────────────────────────

  describe("getMenu", () => {
    it("should return menu when found", async () => {
      req.params.id = "1";
      const menu = { id: 1, name: "Menú del día", restaurant: { id: 1 }, plates: [] };
      mockMenuRepo.findOne.mockResolvedValue(menu);

      await MenuController.getMenu(req, res);

      expect(mockMenuRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["restaurant", "plates"]
      });
      expect(res.json).toHaveBeenCalledWith(menu);
    });

    it("should return 404 when menu not found", async () => {
      req.params.id = "999";
      mockMenuRepo.findOne.mockResolvedValue(null);

      await MenuController.getMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Menú no encontrado" });
    });

    it("should return 500 when findOne throws an error", async () => {
      req.params.id = "1";
      mockMenuRepo.findOne.mockRejectedValue(new Error("DB Error"));

      await MenuController.getMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al obtener el menú" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── UPDATE MENU ─────────────────────────────────────────────────────────────

  describe("updateMenu", () => {
    it("should update and return menu successfully", async () => {
      req.params.id = "1";
      req.body = { name: "Menú actualizado" };
      const existingMenu = { id: 1, name: "Menú del día" };
      const updatedMenu = { id: 1, name: "Menú actualizado" };

      mockMenuRepo.findOneBy.mockResolvedValue(existingMenu);
      mockMenuRepo.merge.mockImplementation(() => {});
      mockMenuRepo.save.mockResolvedValue(updatedMenu);

      await MenuController.updateMenu(req, res);

      expect(mockMenuRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockMenuRepo.merge).toHaveBeenCalledWith(existingMenu, req.body);
      expect(mockMenuRepo.save).toHaveBeenCalledWith(existingMenu);
      expect(res.json).toHaveBeenCalledWith(updatedMenu);
    });

    it("should return 404 when menu not found", async () => {
      req.params.id = "999";
      mockMenuRepo.findOneBy.mockResolvedValue(null);

      await MenuController.updateMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Menú no encontrado" });
    });

    it("should return 500 when findOneBy throws an error", async () => {
      req.params.id = "1";
      mockMenuRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await MenuController.updateMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al actualizar el menú" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when save throws an error", async () => {
      req.params.id = "1";
      req.body = { name: "Menú actualizado" };
      mockMenuRepo.findOneBy.mockResolvedValue({ id: 1, name: "Menú del día" });
      mockMenuRepo.merge.mockImplementation(() => {});
      mockMenuRepo.save.mockRejectedValue(new Error("DB Error"));

      await MenuController.updateMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al actualizar el menú" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── DELETE MENU ─────────────────────────────────────────────────────────────

  describe("deleteMenu", () => {
    it("should delete menu successfully", async () => {
      req.params.id = "1";
      mockMenuRepo.delete.mockResolvedValue({ affected: 1 });

      await MenuController.deleteMenu(req, res);

      expect(mockMenuRepo.delete).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: "Menú eliminado con éxito" });
    });

    it("should return 404 when menu not found", async () => {
      req.params.id = "999";
      mockMenuRepo.delete.mockResolvedValue({ affected: 0 });

      await MenuController.deleteMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Menú no encontrado" });
    });

    it("should return 500 when delete throws an error", async () => {
      req.params.id = "1";
      mockMenuRepo.delete.mockRejectedValue(new Error("DB Error"));

      await MenuController.deleteMenu(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al eliminar el menú" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
