import { Router } from "express";
import { UserController } from "../controller/UserController";
import { keycloak } from "../middleware/keycloak";

const router = Router();
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado en la base de datos local
 *       500:
 *         description: Error al obtener el usuario
 */
router.get("/me", keycloak.protect(), UserController.getMe);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar información de un usuario
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
router.put("/:id", keycloak.protect(), UserController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Users]
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
 *         description: Usuario eliminado con éxito
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol admin_restaurante
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al eliminar el usuario
 */
router.delete("/:id", keycloak.protect("realm:admin_restaurante"), UserController.deleteUser);

export default router;