import { AppDataSource } from "../../database/data-source";
import { Restaurant } from "../../model/Restaurant";
import { User } from "../../model/User";
import { Location } from "../../model/Location";
import { IRestaurantRepository } from "../IRestaurantRepository";

export class PostgresRestaurantRepository implements IRestaurantRepository {
  private repository = AppDataSource.getRepository(Restaurant);

  async findAll(): Promise<Restaurant[]> {
    return await this.repository.find({
      relations: ["location", "admin"],
    });
  }

  async findById(id: number): Promise<Restaurant | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["location", "admin"],
    });
  }

  async create(data: Partial<Restaurant> & { location_id?: number; admin_id?: number }): Promise<Restaurant> {
    const restaurant = new Restaurant();
    // También se puede usar Object.assign o this.repository.create
    if (data.name) restaurant.name = data.name;
    
    // Si uso created_at generado automáticamente, podría omitirlo o setearlo:
    restaurant.created_at = new Date(); 

    if (data.admin_id) {
      const userRepo = AppDataSource.getRepository(User);
      const admin = await userRepo.findOneBy({ id: data.admin_id });
      if (admin) restaurant.admin = admin;
    }

    if (data.location_id) {
      const locationRepo = AppDataSource.getRepository(Location);
      const location = await locationRepo.findOneBy({ id: data.location_id });
      if (location) restaurant.location = location;
    }

    return await this.repository.save(restaurant);
  }

  async update(id: number, data: Partial<Restaurant>): Promise<Restaurant | null> {
    const restaurant = await this.findById(id);
    if (!restaurant) return null;
    
    Object.assign(restaurant, data);
    return await this.repository.save(restaurant);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected! > 0;
  }
}
