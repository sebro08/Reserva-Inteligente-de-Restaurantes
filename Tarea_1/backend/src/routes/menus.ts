import { Router } from "express";
import { MenuController } from "../controller/MenuController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

router.post("/", keycloak.protect("realm:admin_restaurante"), MenuController.createMenu);
router.get("/:id", keycloak.protect(), MenuController.getMenu);
router.put("/:id", keycloak.protect("realm:admin_restaurante"), MenuController.updateMenu);
router.delete("/:id", keycloak.protect("realm:admin_restaurante"), MenuController.deleteMenu);

export default router;