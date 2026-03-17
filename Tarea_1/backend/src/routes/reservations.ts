import { Router } from "express";
import { ReservationController } from "../controller/ReservationController";

const router = Router();

router.post("/", ReservationController.createReservation);
router.delete("/:id", ReservationController.deleteReservation);

export default router;