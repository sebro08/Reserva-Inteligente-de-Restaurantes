import { User } from "../model/User";

export interface IUserRepository {
  findByKeycloakId(keycloakId: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  update(id: number, data: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
  // For auth:
  create(data: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}
