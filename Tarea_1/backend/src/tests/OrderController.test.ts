import { Request, Response } from "express";

// Mock ANTES de importar el controlador
const mockOrderRepo = {
  save: jest.fn(),
  findOne: jest.fn()
};

const mockUserRepo = {
  findOneBy: jest.fn()
};

const mockRestaurantRepo = {
  findOneBy: jest.fn()
};

jest.mock("../database/data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity.name === "User") return mockUserRepo;
      if (entity.name === "Restaurant") return mockRestaurantRepo;
      return mockOrderRepo;
    })
  }
}));

import { OrderController } from "../controller/OrderController";

describe("OrderController", () => {
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

  // ─── CREATE ORDER ────────────────────────────────────────────────────────────

  describe("createOrder", () => {
    it("should create order successfully without user and restaurant", async () => {
      req.body = { pickup: true };
      mockOrderRepo.save.mockResolvedValue({ id: 1, pickup: true });

      await OrderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create order with valid user", async () => {
      req.body = { user_id: 1, pickup: false };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1, name: "John" });
      mockOrderRepo.save.mockResolvedValue({ id: 1, user: { id: 1 } });

      await OrderController.createOrder(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create order when user_id provided but user not found", async () => {
      req.body = { user_id: 999 };
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockOrderRepo.save.mockResolvedValue({ id: 1 });

      await OrderController.createOrder(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create order with valid restaurant", async () => {
      req.body = { restaurant_id: 1 };
      mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 1, name: "Restaurant" });
      mockOrderRepo.save.mockResolvedValue({ id: 1, restaurant: { id: 1 } });

      await OrderController.createOrder(req, res);

      expect(mockRestaurantRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create order when restaurant_id provided but restaurant not found", async () => {
      req.body = { restaurant_id: 999 };
      mockRestaurantRepo.findOneBy.mockResolvedValue(null);
      mockOrderRepo.save.mockResolvedValue({ id: 1 });

      await OrderController.createOrder(req, res);

      expect(mockRestaurantRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create order with valid user and restaurant", async () => {
      req.body = { user_id: 1, restaurant_id: 1, pickup: true };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockOrderRepo.save.mockResolvedValue({
        id: 1,
        user: { id: 1 },
        restaurant: { id: 1 },
        pickup: true
      });

      await OrderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 500 when save throws an error", async () => {
      req.body = { pickup: true };
      mockOrderRepo.save.mockRejectedValue(new Error("DB Error"));

      await OrderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al realizar el pedido" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when userRepo.findOneBy throws an error", async () => {
      req.body = { user_id: 1 };
      mockUserRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await OrderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al realizar el pedido" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when restaurantRepo.findOneBy throws an error", async () => {
      req.body = { restaurant_id: 1 };
      mockRestaurantRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await OrderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al realizar el pedido" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── GET ORDER ───────────────────────────────────────────────────────────────

  describe("getOrder", () => {
    it("should return order when found", async () => {
      req.params.id = "1";
      const order = { id: 1, user: { id: 1 }, restaurant: { id: 1 }, items: [] };
      mockOrderRepo.findOne.mockResolvedValue(order);

      await OrderController.getOrder(req, res);

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
      expect(res.json).toHaveBeenCalledWith(order);
    });

    it("should return 404 when order not found", async () => {
      req.params.id = "999";
      mockOrderRepo.findOne.mockResolvedValue(null);

      await OrderController.getOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Pedido no encontrado" });
    });

    it("should return 500 when findOne throws an error", async () => {
      req.params.id = "1";
      mockOrderRepo.findOne.mockRejectedValue(new Error("DB Error"));

      await OrderController.getOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al obtener el pedido" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
