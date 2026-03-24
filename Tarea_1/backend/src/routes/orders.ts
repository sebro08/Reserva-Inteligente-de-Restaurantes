import { Router } from "express";
import { OrderController } from "../controller/OrderController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

router.post("/", keycloak.protect("realm:cliente_restaurante"), OrderController.createOrder);
router.get("/:id", keycloak.protect(), OrderController.getOrder);

export default router;