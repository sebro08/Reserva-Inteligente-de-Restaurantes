import { Request, Response } from "express";

// Mocks ANTES de importar el controlador
const mockReservationRepo = {
  save: jest.fn(),
  delete: jest.fn()
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
      return mockReservationRepo;
    })
  }
}));

import { ReservationController } from "../controller/ReservationController";

describe("ReservationController", () => {
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

  // ─── CREATE RESERVATION ──────────────────────────────────────────────────────

  describe("createReservation", () => {
    it("should create reservation successfully without user and restaurant", async () => {
      req.body = {
        reservation_date: "2025-12-01",
        reservation_time: "19:00",
        people_count: 4
      };
      mockReservationRepo.save.mockResolvedValue({
        id: 1,
        reservation_date: new Date("2025-12-01"),
        reservation_time: "19:00",
        people_count: 4
      });

      await ReservationController.createReservation(req, res);

      expect(mockReservationRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create reservation with valid user", async () => {
      req.body = {
        user_id: 1,
        reservation_date: "2025-12-01",
        reservation_time: "20:00",
        people_count: 2
      };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1, name: "John" });
      mockReservationRepo.save.mockResolvedValue({ id: 1, user: { id: 1 } });

      await ReservationController.createReservation(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create reservation when user_id provided but user not found", async () => {
      req.body = {
        user_id: 999,
        reservation_date: "2025-12-01",
        reservation_time: "20:00",
        people_count: 2
      };
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockReservationRepo.save.mockResolvedValue({ id: 1 });

      await ReservationController.createReservation(req, res);

      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create reservation with valid restaurant", async () => {
      req.body = {
        restaurant_id: 1,
        reservation_date: "2025-12-01",
        reservation_time: "21:00",
        people_count: 6
      };
      mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 1, name: "La Trattoria" });
      mockReservationRepo.save.mockResolvedValue({ id: 1, restaurant: { id: 1 } });

      await ReservationController.createReservation(req, res);

      expect(mockRestaurantRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should create reservation when restaurant_id provided but restaurant not found", async () => {
      req.body = {
        restaurant_id: 999,
        reservation_date: "2025-12-01",
        reservation_time: "21:00",
        people_count: 6
      };
      mockRestaurantRepo.findOneBy.mockResolvedValue(null);
      mockReservationRepo.save.mockResolvedValue({ id: 1 });

      await ReservationController.createReservation(req, res);

      expect(mockRestaurantRepo.findOneBy).toHaveBeenCalledWith({ id: 999 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create reservation with valid user and restaurant", async () => {
      req.body = {
        user_id: 1,
        restaurant_id: 1,
        reservation_date: "2025-12-25",
        reservation_time: "20:00",
        people_count: 8
      };
      mockUserRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockReservationRepo.save.mockResolvedValue({
        id: 1,
        user: { id: 1 },
        restaurant: { id: 1 }
      });

      await ReservationController.createReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 500 when save throws an error", async () => {
      req.body = {
        reservation_date: "2025-12-01",
        reservation_time: "19:00",
        people_count: 2
      };
      mockReservationRepo.save.mockRejectedValue(new Error("DB Error"));

      await ReservationController.createReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear la reserva" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when userRepo.findOneBy throws an error", async () => {
      req.body = {
        user_id: 1,
        reservation_date: "2025-12-01",
        reservation_time: "19:00",
        people_count: 2
      };
      mockUserRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await ReservationController.createReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear la reserva" });
      expect(console.error).toHaveBeenCalled();
    });

    it("should return 500 when restaurantRepo.findOneBy throws an error", async () => {
      req.body = {
        restaurant_id: 1,
        reservation_date: "2025-12-01",
        reservation_time: "19:00",
        people_count: 2
      };
      mockRestaurantRepo.findOneBy.mockRejectedValue(new Error("DB Error"));

      await ReservationController.createReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al crear la reserva" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── DELETE RESERVATION ──────────────────────────────────────────────────────

  describe("deleteReservation", () => {
    it("should delete reservation successfully", async () => {
      req.params.id = "1";
      mockReservationRepo.delete.mockResolvedValue({ affected: 1 });

      await ReservationController.deleteReservation(req, res);

      expect(mockReservationRepo.delete).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: "Reserva cancelada con éxito" });
    });

    it("should return 404 when reservation not found", async () => {
      req.params.id = "999";
      mockReservationRepo.delete.mockResolvedValue({ affected: 0 });

      await ReservationController.deleteReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Reserva no encontrada" });
    });

    it("should return 500 when delete throws an error", async () => {
      req.params.id = "1";
      mockReservationRepo.delete.mockRejectedValue(new Error("DB Error"));

      await ReservationController.deleteReservation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error al cancelar la reserva" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
