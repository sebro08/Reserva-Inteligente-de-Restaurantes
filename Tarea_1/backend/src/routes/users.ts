import { Router } from "express";
import { UserController } from "../controller/UserController";

const router = Router();

router.get("/me", UserController.getMe);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

export default router;