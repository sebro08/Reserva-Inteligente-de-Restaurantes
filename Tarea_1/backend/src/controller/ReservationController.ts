import { Request, Response } from "express";
import { RepositoryFactory } from "../repository/RepositoryFactory";

const reservationRepository = RepositoryFactory.getReservationRepository();

export class ReservationController {
  
  // POST /reservations - Crear una nueva reserva
  static async createReservation(req: Request, res: Response) {
    try {
      const { user_id, restaurant_id, reservation_date, reservation_time, people_count } = req.body;
      
      const reservation = await reservationRepository.create({
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        people_count
      });

      res.status(201).json(reservation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al crear la reserva" });
    }
  }

  // DELETE /reservations/:id - Cancelar una reserva
  static async deleteReservation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const isDeleted = await reservationRepository.delete(parseInt(id));
      
      if (!isDeleted) {
         return res.status(404).json({ message: "Reserva no encontrada" });
      }
      
      res.json({ message: "Reserva cancelada con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al cancelar la reserva" });
    }
  }
}
