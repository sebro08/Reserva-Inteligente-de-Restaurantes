import { Router } from "express";
import { ReservationController } from "../controller/ReservationController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

router.post("/", keycloak.protect("realm:cliente_restaurante"), ReservationController.createReservation);
router.delete("/:id", keycloak.protect(), ReservationController.deleteReservation);

export default router;