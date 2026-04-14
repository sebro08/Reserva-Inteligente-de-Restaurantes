import { Restaurant } from "../model/Restaurant";

export interface IRestaurantRepository {
  findAll(): Promise<Restaurant[]>;
  findById(id: number): Promise<Restaurant | null>;
  create(data: Partial<Restaurant> & { location_id?: number; admin_id?: number }): Promise<Restaurant>;
  update(id: number, data: Partial<Restaurant>): Promise<Restaurant | null>;
  delete(id: number): Promise<boolean>;
}
