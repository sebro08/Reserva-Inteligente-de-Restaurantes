import { Router } from "express";
import { getTopProducts } from "./graph.controller";

const router = Router();

router.get(
  "/top-products",
  getTopProducts
);

export default router;