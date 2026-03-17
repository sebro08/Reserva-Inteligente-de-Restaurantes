import { Router } from "express";
import { OrderController } from "../controller/OrderController";

const router = Router();

router.post("/", OrderController.createOrder);
router.get("/:id", OrderController.getOrder);

export default router;