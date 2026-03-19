"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RestaurantController_1 = require("../controller/RestaurantController");
const keycloak_1 = require("../middleware/keycloak");
const router = (0, express_1.Router)();
router.post("/", keycloak_1.keycloak.protect("realm:admin_restaurante"), RestaurantController_1.RestaurantController.createRestaurant);
router.get("/", keycloak_1.keycloak.protect(), RestaurantController_1.RestaurantController.getRestaurants);
exports.default = router;
