import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";
import restaurantRoutes from "./restaurants";
import menuRoutes from "./menus";
import reservationRoutes from "./reservations";
import orderRoutes from "./orders";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/menus", menuRoutes);
router.use("/reservations", reservationRoutes);
router.use("/orders", orderRoutes);

export default router;