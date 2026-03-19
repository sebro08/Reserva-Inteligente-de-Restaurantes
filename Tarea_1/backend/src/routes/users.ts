import { Router } from "express";
import { UserController } from "../controller/UserController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

router.get("/me", keycloak.protect(), UserController.getMe);
router.put("/:id", keycloak.protect(), UserController.updateUser);
router.delete("/:id", keycloak.protect("realm:admin_restaurante"), UserController.deleteUser);

export default router;