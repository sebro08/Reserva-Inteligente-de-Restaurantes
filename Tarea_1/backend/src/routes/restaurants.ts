import { Router } from "express";
import { RestaurantController } from "../controller/RestaurantController";

const router = Router();

router.post("/", RestaurantController.createRestaurant);
router.get("/", RestaurantController.getRestaurants);

export default router;