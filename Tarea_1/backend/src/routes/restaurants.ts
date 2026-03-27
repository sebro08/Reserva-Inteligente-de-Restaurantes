import { Router } from "express";
import { RestaurantController } from "../controller/RestaurantController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Crear un nuevo restaurante
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Soda Tapia
 *               admin_id:
 *                 type: integer
 *                 example: 1
 *               location_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Restaurante creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol admin_restaurante
 *       500:
 *         description: Error al crear el restaurante
 */
router.post("/", keycloak.protect("realm:admin_restaurante"), RestaurantController.createRestaurant);

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Obtener todos los restaurantes
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de restaurantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   location:
 *                     type: object
 *                   admin:
 *                     type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al obtener restaurantes
 */
router.get("/", keycloak.protect(), RestaurantController.getRestaurants);

export default router;