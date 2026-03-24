"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReservationController_1 = require("../controller/ReservationController");
const keycloak_1 = require("../middleware/keycloak");
const router = (0, express_1.Router)();
router.post("/", keycloak_1.keycloak.protect("realm:cliente_restaurante"), ReservationController_1.ReservationController.createReservation);
router.delete("/:id", keycloak_1.keycloak.protect(), ReservationController_1.ReservationController.deleteReservation);
exports.default = router;
