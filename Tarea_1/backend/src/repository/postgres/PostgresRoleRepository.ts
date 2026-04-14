import { AppDataSource } from "../../database/data-source";
import { Role } from "../../model/Role";
import { IRoleRepository } from "../IRoleRepository";

export class PostgresRoleRepository implements IRoleRepository {
  private repository = AppDataSource.getRepository(Role);

  async findByName(name: string): Promise<Role | null> {
    return await this.repository.findOneBy({ name });
  }
}
