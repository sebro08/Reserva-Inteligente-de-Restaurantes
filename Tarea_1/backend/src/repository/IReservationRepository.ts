import { Reservation } from "../model/Reservation";

export interface IReservationRepository {
  create(data: Partial<Reservation> & { user_id?: number, restaurant_id?: number }): Promise<Reservation>;
  delete(id: number): Promise<boolean>;
}
