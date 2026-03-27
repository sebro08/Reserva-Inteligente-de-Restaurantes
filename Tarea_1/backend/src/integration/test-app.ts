import express from "express";
import "reflect-metadata";
import cors from "cors";
import { TestDataSource } from "../database/data-source.test";

// Reemplazar AppDataSource ANTES de importar rutas/controladores
(global as any).__TEST_DATASOURCE__ = TestDataSource;

import { MenuController } from "../controller/MenuController";
import { OrderController } from "../controller/OrderController";
import { ReservationController } from "../controller/ReservationController";
import { RestaurantController } from "../controller/RestaurantController";
import { UserController } from "../controller/UserController";
import { AuthController } from "../controller/AuthController";

export const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Registrar rutas directamente sin Keycloak
  app.post("/menus",        MenuController.createMenu);
  app.get("/menus/:id",     MenuController.getMenu);
  app.put("/menus/:id",     MenuController.updateMenu);
  app.delete("/menus/:id",  MenuController.deleteMenu);

  app.post("/orders",       OrderController.createOrder);
  app.get("/orders/:id",    OrderController.getOrder);

  app.post("/reservations",       ReservationController.createReservation);
  app.delete("/reservations/:id", ReservationController.deleteReservation);

  app.post("/restaurants",  RestaurantController.createRestaurant);
  app.get("/restaurants",   RestaurantController.getRestaurants);

  app.get("/users/me",      UserController.getMe);
  app.put("/users/:id",     UserController.updateUser);
  app.delete("/users/:id",  UserController.deleteUser);

  app.post("/auth/register", AuthController.register);
  app.post("/auth/login",    AuthController.login);

  return app;
};