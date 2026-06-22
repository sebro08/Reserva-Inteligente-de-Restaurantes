import { Router } from "express";
import * as graphController from "./graph.controller";

const router = Router();

router.get("/test", (_, res) => {
  res.json({
    message: "Graph funcionando"
  });
});

/**
 * @swagger
 * /graph/top-products:
 *   get:
 *     summary: Obtener los productos más pedidos
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos más vendidos
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/top-products", graphController.getTopProducts);

/**
 * @swagger
 * /graph/recommending-users:
 *   get:
 *     summary: Usuarios recomendados según patrones de pedido
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios recomendados
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/recommending-users", graphController.getRecommendingUsers);

/**
 * @swagger
 * /graph/shortest-path:
 *   get:
 *     summary: Calcular la ruta más corta entre dos ubicaciones
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la Location de origen
 *         example: 1
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la Location de destino
 *         example: 2
 *     responses:
 *       200:
 *         description: Ruta calculada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 path:
 *                   type: array
 *                   items:
 *                     type: object
 *                 distance:
 *                   type: number
 *                   example: 4.2
 *       400:
 *         description: Faltan los query params 'from' y/o 'to'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/shortest-path", graphController.getShortestPath);

/**
 * @swagger
 * /graph/delivery-routes:
 *   get:
 *     summary: Asignar rutas de entrega óptimas
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del restaurante desde el cual se reparten los pedidos
 *         example: 1
 *     responses:
 *       200:
 *         description: Rutas asignadas exitosamente
 *       400:
 *         description: Falta el query param 'restaurantId'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/delivery-routes", graphController.assignDeliveryRoutes);

export default router;