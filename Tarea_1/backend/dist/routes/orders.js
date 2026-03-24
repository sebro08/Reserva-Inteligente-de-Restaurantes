"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrderController_1 = require("../controller/OrderController");
const keycloak_1 = require("../middleware/keycloak");
const router = (0, express_1.Router)();
router.post("/", keycloak_1.keycloak.protect("realm:cliente_restaurante"), OrderController_1.OrderController.createOrder);
router.get("/:id", keycloak_1.keycloak.protect(), OrderController_1.OrderController.getOrder);
exports.default = router;
