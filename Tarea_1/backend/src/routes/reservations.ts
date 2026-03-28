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
 *             type: object
 *             required: [reservation_date, reservation_time, people_count]
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *               restaurant_id:
 *                 type: integer
 *                 example: 1
 *               reservation_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-30"
 *               reservation_time:
 *                 type: string
 *                 example: "19:30:00"
 *               people_count:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente
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
 