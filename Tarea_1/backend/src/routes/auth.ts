import { Router } from "express";
import { AuthController } from "../controller/AuthController";

const router = Router();


router.post("/register", AuthController.register);
/*
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
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
 *               password:
 *                 type: string
 *                 example: pass123
 *               role_name:
 *                 type: string
 *                 enum:
 *                   - cliente_restaurante
 *                   - admin_restaurante
 *                 example: cliente_restaurante
 *     responses:
 *       201:
 *         description: Usuario creado y sincronizado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario creado y sincronizado con éxito
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Faltan campos requeridos o el rol no existe
 *       409:
 *         description: El usuario ya existe (correo ya registrado)
 *       500:
 *         description: Error interno en el registro del usuario
 */
router.post("/login", AuthController.login);

export default router;