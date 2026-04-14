import { AppDataSource } from "../../database/data-source";
import { User } from "../../model/User";
import { IUserRepository } from "../IUserRepository";

export class PostgresUserRepository implements IUserRepository {
  private repository = AppDataSource.getRepository(User);

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return await this.repository.findOneBy({ keycloak_id: keycloakId });
  }

  async findById(id: number): Promise<User | null> {
    return await this.repository.findOneBy({ id });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return await this.repository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    
    this.repository.merge(user, data);
    return await this.repository.save(user);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected! > 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOneBy({ email });
  }
}
