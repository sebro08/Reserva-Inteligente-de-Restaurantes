import { Request, Response } from "express";

// Mocks ANTES de importar el controlador
const mockRestaurantRepo = {
  find: jest.fn(),
  save: jest.fn()
};

const mockUserRepo = {
  findOneBy: jest.fn()
};

const mockLocationRepo = {
  findOneBy: jest.fn()
};

jest.mock("../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity.name === "User") return mockUserRepo;
      if (entity.name === "Location") return mockLocationRepo;
      return mockRestaurantRepo;
    })
  }
}));

import { RestaurantController } from "../controller/RestaurantController";

describe("RestaurantController", () => {
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

  // ─── GET RESTAURANTS ─────────────────────────────────────────────────────────

  describe("getRestaurants", () => {
    it("should return all restaurants with relations", async () => {
      const restaurants = [
        { id: 1, name: "El Rancho", location: { id: 1 }, admin: { id: 1 } },
        { id: 2, name: "La Trattoria", location: { id: 2 }, admin: { id: 2 } }
      ];
      mockRestaurantRepo.find.mockResolvedValue(restaurants);

      await RestaurantController.getRestaurants(req, res);

      expect(mockRestaurantRepo.find).toHaveBeenCalledWith({
        relations: ["location", "admin"]
      });
      expect(res.json).toHaveBeenCalledWith(restaurants);
    });

    it("should return empty array when no restaurants exist", async () => {
      mockRestaurantRepo.find.mockResolvedValue([]);

      await RestaurantController.getRestaurants(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 when find throws an error", async () => {
      mockRestaurantRepo.find.mockRejectedValue(new Error("DB Error"));

      await RestaurantController.getRestaurants(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al obtener restaurantes" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── CREATE RESTAURANT ───────────────────────────────────────────────────────

  describe("createRestaurant", () => {
    it("should create restaurant successfully without admin and location", async () => {
      req.body = { name: "Soda Tapia" };
      mockRestaurantRepo.save.mockResolvedValue({ id: 1, name: "Soda Tapia" });

      await RestaurantController.createRestaurant(req, res);

      expect(mockRestaurantRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create restaurant with valid admin", async () => {
      req.body = { name: "Soda Tapia", admin_id: 1 };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1, name: "Admin User" });
      mockRestaurantRepo.save.mockResolvedValue({ id: 1, name: "Soda Tapia", admin: { id: 1 } });

      await RestaurantController.createRestaurant(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create restaurant when admin_id provided but admin not found", async () => {
      req.body = { name: "Soda Tapia", admin_id: 999 };
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockRestaurantRepo.save.mockResolvedValue({ id: 1, name: "Soda Tapia" });

      await RestaurantController.createRestaurant(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create restaurant with valid location", async () => {
      req.body = { name: "Soda Tapia", location_id: 1 };
      mockLocationRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockRestaurantRepo.save.mockResolvedValue({ id: 1, name: "Soda Tapia", location: { id: 1 } });

      await RestaurantController.createRestaurant(req, res);

      expect(mockLocationRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create restaurant when location_id provided but location not found", async () => {
      req.body = { name: "Soda Tapia", location_id: 999 };
      mockLocationRepo.findOneBy.mockResolvedValue(null);
      mockRestaurantRepo.save.mockResolvedValue({ id: 1, name: "Soda Tapia" });

      await RestaurantController.createRestaurant(req, res);

      expect(mockLocationRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create restaurant with valid admin and location", async () => {
      req.body = { name: "Soda Tapia", admin_id: 1, location_id: 1 };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockLocationRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockRestaurantRepo.save.mockResolvedValue({
        id: 1,
        name: "Soda Tapia",
        admin: { id: 1 },
        location: { id: 1 }
      });

      await RestaurantController.createRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 500 when save throws an error", async () => {
      req.body = { name: "Soda Tapia" };
      mockRestaurantRepo.save.mockRejectedValue(new Error("DB Error"));

      await RestaurantController.createRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear el restaurante" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when userRepo.findOneBy throws an error", async () => {
      req.body = { name: "Soda Tapia", admin_id: 1 };
      mockUserRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await RestaurantController.createRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear el restaurante" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when locationRepo.findOneBy throws an error", async () => {
      req.body = { name: "Soda Tapia", location_id: 1 };
      mockLocationRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await RestaurantController.createRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear el restaurante" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
