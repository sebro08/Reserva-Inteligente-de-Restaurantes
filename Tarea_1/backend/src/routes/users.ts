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
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 keycloak_id:
 *                   type: string
 *                 is_active:
 *                   type: boolean
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
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Juan
 *               last_name:
 *                 type: string
 *                 example: Pérez
 *               email:
 *                 type: string
 *                 example: juan@correo.com
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
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