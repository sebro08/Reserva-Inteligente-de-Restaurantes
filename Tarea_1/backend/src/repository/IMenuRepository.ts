import { Menu } from "../model/Menu";

export interface IMenuRepository {
  findById(id: number): Promise<Menu | null>;
  create(data: Partial<Menu> & { restaurant_id?: number }): Promise<Menu>;
  update(id: number, data: Partial<Menu>): Promise<Menu | null>;
  delete(id: number): Promise<boolean>;
}
