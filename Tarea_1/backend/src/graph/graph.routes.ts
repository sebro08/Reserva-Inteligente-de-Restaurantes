import { Router } from "express";
import * as graphController from "./graph.controller";

const router = Router();

router.get("/test", (_, res) => {
  res.json({
    message: "Graph funcionando"
  });
});

router.get("/top-products", graphController.getTopProducts);
router.get("/recommending-users", graphController.getRecommendingUsers);
router.get("/shortest-path", graphController.getShortestPath);
router.get("/delivery-routes", graphController.assignDeliveryRoutes);

export default router;