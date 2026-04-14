import { AppDataSource } from "../../database/data-source";
import { Reservation } from "../../model/Reservation";
import { User } from "../../model/User";
import { Restaurant } from "../../model/Restaurant";
import { IReservationRepository } from "../IReservationRepository";

export class PostgresReservationRepository implements IReservationRepository {
  private repository = AppDataSource.getRepository(Reservation);

  async create(data: Partial<Reservation> & { user_id?: number, restaurant_id?: number }): Promise<Reservation> {
    const reservation = new Reservation();
    if (data.reservation_date) reservation.reservation_date = new Date(data.reservation_date);
    if (data.reservation_time) reservation.reservation_time = data.reservation_time;
    if (data.people_count) reservation.people_count = data.people_count;

    if (data.user_id) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: data.user_id });
      if (user) reservation.user = user;
    }

    if (data.restaurant_id) {
      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: data.restaurant_id });
      if (restaurant) reservation.restaurant = restaurant;
    }

    return await this.repository.save(reservation);
  }

  async delete(id: number): Promise<boolean> {
    const results = await this.repository.delete(id);
    return results.affected !== null && results.affected! > 0;
  }
}
