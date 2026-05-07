import { Router } from "express";
import { RestaurantController } from "../controller/RestaurantController";
import { keycloak } from "../middleware/keycloak";
import { cacheMiddleware } from "../middleware/cache";

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
 *             $ref: '#/components/schemas/CreateRestaurantRequest'
 *     responses:
 *       201:
 *         description: Restaurante creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
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
 *                 $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al obtener restaurantes
 */
router.get("/", keycloak.protect(), cacheMiddleware(1800), RestaurantController.getRestaurants);

export default router;