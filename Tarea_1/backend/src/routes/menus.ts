import { Router } from "express";
import { MenuController } from "../controller/MenuController";

const router = Router();

router.post("/", MenuController.createMenu);
router.get("/:id", MenuController.getMenu);
router.put("/:id", MenuController.updateMenu);
router.delete("/:id", MenuController.deleteMenu);

export default router;