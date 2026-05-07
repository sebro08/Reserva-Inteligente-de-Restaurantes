import { Router } from "express";
import { OrderController } from "../controller/OrderController";
import { keycloak } from "../middleware/keycloak";

const router = Router();
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol cliente_restaurante
 *       500:
 *         description: Error al realizar el pedido
 */
router.post("/", keycloak.protect("realm:cliente_restaurante"), OrderController.createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener detalles de un pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Pedido no encontrado
 *       500:
 *         description: Error al obtener el pedido
 */
router.get("/:id", keycloak.protect(), OrderController.getOrder);
export default router;