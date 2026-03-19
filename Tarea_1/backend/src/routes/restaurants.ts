import { Router } from "express";
import { RestaurantController } from "../controller/RestaurantController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

router.post("/", keycloak.protect("realm:admin_restaurante"), RestaurantController.createRestaurant);
router.get("/", keycloak.protect(), RestaurantController.getRestaurants);

export default router;