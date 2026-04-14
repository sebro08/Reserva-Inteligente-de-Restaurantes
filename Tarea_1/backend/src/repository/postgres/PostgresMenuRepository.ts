import { AppDataSource } from "../../database/data-source";
import { Menu } from "../../model/Menu";
import { Restaurant } from "../../model/Restaurant";
import { IMenuRepository } from "../IMenuRepository";

export class PostgresMenuRepository implements IMenuRepository {
  private repository = AppDataSource.getRepository(Menu);

  async findById(id: number): Promise<Menu | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["restaurant", "plates"]
    });
  }

  async create(data: Partial<Menu> & { restaurant_id?: number }): Promise<Menu> {
    const menu = new Menu();
    if (data.name) menu.name = data.name;
    
    if (data.restaurant_id) {
      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: data.restaurant_id });
      if (restaurant) menu.restaurant = restaurant;
    }

    return await this.repository.save(menu);
  }

  async update(id: number, data: Partial<Menu>): Promise<Menu | null> {
    // En el Original se hace findOneBy({id}), nosotros también lo hacemos aquí
    const menu = await this.repository.findOneBy({ id });
    if (!menu) return null;

    this.repository.merge(menu, data);
    return await this.repository.save(menu);
  }

  async delete(id: number): Promise<boolean> {
    const results = await this.repository.delete(id);
    return results.affected !== null && results.affected! > 0;
  }
}
