import { Router } from "express";
import { AuthController } from "../controller/AuthController";

const router = Router();

/**
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
 *             required: [first_name, last_name, email, password]
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
 *                 example: "pass123"
 *               role_name:
 *                 type: string
 *                 enum: [cliente_restaurante, admin_restaurante]
 *                 example: cliente_restaurante
 *     responses:
 *       201:
 *         description: Usuario creado y sincronizado con éxito
 *       400:
 *         description: Faltan campos requeridos o el rol no existe
 *       409:
 *         description: El usuario ya existe (correo ya registrado)
 *       500:
 *         description: Error interno en el registro del usuario
 */
router.post("/register", AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan@correo.com
 *               password:
 *                 type: string
 *                 example: "pass123"
 *     responses:
 *       200:
 *         description: Login exitoso, retorna tokens de Keycloak
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login exitoso
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 expires_in:
 *                   type: integer
 *                   example: 3600
 *       400:
 *         description: Faltan credenciales
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno al iniciar sesión
 */
router.post("/login", AuthController.login);

export default router;