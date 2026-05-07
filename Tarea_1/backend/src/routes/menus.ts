import { Router } from "express";
import { MenuController } from "../controller/MenuController";
import { keycloak } from "../middleware/keycloak";
import { cacheMiddleware } from "../middleware/cache";

const router = Router();
/**
 * @swagger
 * /menus:
 *   post:
 *     summary: Crear un nuevo menú
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Menú del día
 *               restaurant_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Menú creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol admin_restaurante
 *       500:
 *         description: Error al crear el menú
 */
router.post("/", keycloak.protect("realm:admin_restaurante"), MenuController.createMenu);
/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     summary: Obtener detalles de un menú
 *     tags: [Menus]
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
 *         description: Menú encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Menú no encontrado
 *       500:
 *         description: Error al obtener el menú
 */
router.get("/:id", keycloak.protect(), cacheMiddleware(1800), MenuController.getMenu);
/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     summary: Actualizar un menú
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Menú actualizado
 *     responses:
 *       200:
 *         description: Menú actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol admin_restaurante
 *       404:
 *         description: Menú no encontrado
 *       500:
 *         description: Error al actualizar el menú
 */
router.put("/:id", keycloak.protect("realm:admin_restaurante"), MenuController.updateMenu);
/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     summary: Eliminar un menú
 *     tags: [Menus]
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
 *         description: Menú eliminado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Menú eliminado con éxito
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol admin_restaurante
 *       404:
 *         description: Menú no encontrado
 *       500:
 *         description: Error al eliminar el menú
 */
router.delete("/:id", keycloak.protect("realm:admin_restaurante"), MenuController.deleteMenu);

export default router;