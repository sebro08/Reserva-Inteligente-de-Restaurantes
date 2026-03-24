"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const data_source_1 = require("../database/data-source");
const Reservation_1 = require("../model/Reservation");
const User_1 = require("../model/User");
const Restaurant_1 = require("../model/Restaurant");
const reservationRepository = data_source_1.AppDataSource.getRepository(Reservation_1.Reservation);
class ReservationController {
    // POST /reservations - Crear una nueva reserva
    static async createReservation(req, res) {
        try {
            const { user_id, restaurant_id, reservation_date, reservation_time, people_count } = req.body;
            const reservation = new Reservation_1.Reservation();
            reservation.reservation_date = new Date(reservation_date);
            reservation.reservation_time = reservation_time;
            reservation.people_count = people_count;
            if (user_id) {
                const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
                const user = await userRepo.findOneBy({ id: user_id });
                if (user)
                    reservation.user = user;
            }
            if (restaurant_id) {
                const restaurantRepo = data_source_1.AppDataSource.getRepository(Restaurant_1.Restaurant);
                const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });
                if (restaurant)
                    reservation.restaurant = restaurant;
            }
            await reservationRepository.save(reservation);
            res.status(201).json(reservation);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al crear la reserva" });
        }
    }
    // DELETE /reservations/:id - Cancelar una reserva
    static async deleteReservation(req, res) {
        try {
            const { id } = req.params;
            const results = await reservationRepository.delete(parseInt(id));
            if (results.affected === 0) {
                return res.status(404).json({ message: "Reserva no encontrada" });
            }
            res.json({ message: "Reserva cancelada con éxito" });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error al cancelar la reserva" });
        }
    }
}
exports.ReservationController = ReservationController;
