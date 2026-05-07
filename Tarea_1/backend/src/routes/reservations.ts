import { Router } from "express";
import { ReservationController } from "../controller/ReservationController";
import { keycloak } from "../middleware/keycloak";

const router = Router();

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Crear una nueva reserva
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Forbidden - requiere rol cliente_restaurante
 *       500:
 *         description: Error al crear la reserva
 */
router.post("/", keycloak.protect("realm:cliente_restaurante"), ReservationController.createReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Cancelar una reserva
 *     tags: [Reservations]
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
 *         description: Reserva cancelada con éxito
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al cancelar la reserva
 */
router.delete("/:id", keycloak.protect(), ReservationController.deleteReservation);
export default router;