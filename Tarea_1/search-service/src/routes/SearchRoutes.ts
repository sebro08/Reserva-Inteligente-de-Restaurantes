import { Router } from "express";
import { SearchController } from "../controller/SearchController";

const router = Router();

router.get("/search/products", SearchController.searchProducts);
router.get("/search/products/category/:categoria", SearchController.searchByCategory);
router.post("/search/reindex", SearchController.reindex);

export default router;