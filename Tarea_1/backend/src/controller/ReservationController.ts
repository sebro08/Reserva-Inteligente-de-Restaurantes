import { Request, Response } from "express";
import { AppDataSource } from "../database/data-source";
import { Reservation } from "../model/Reservation";
import { User } from "../model/User";
import { Restaurant } from "../model/Restaurant";

const reservationRepository = AppDataSource.getRepository(Reservation);

export class ReservationController {
  
  // POST /reservations - Crear una nueva reserva
  static async createReservation(req: Request, res: Response) {
    try {
      const { user_id, restaurant_id, reservation_date, reservation_time, people_count } = req.body;
      
      const reservation = new Reservation();
      reservation.reservation_date = new Date(reservation_date);
      reservation.reservation_time = reservation_time;
      reservation.people_count = people_count;

      if (user_id) {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: user_id });
        if (user) reservation.user = user;
      }

      if (restaurant_id) {
        const restaurantRepo = AppDataSource.getRepository(Restaurant);
        const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });
        if (restaurant) reservation.restaurant = restaurant;
      }

      await reservationRepository.save(reservation);
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
      const results = await reservationRepository.delete(parseInt(id));
      
      if (results.affected === 0) {
         return res.status(404).json({ message: "Reserva no encontrada" });
      }
      
      res.json({ message: "Reserva cancelada con éxito" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al cancelar la reserva" });
    }
  }
}
