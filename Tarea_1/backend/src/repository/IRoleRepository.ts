import { Role } from "../model/Role";

export interface IRoleRepository {
  findByName(name: string): Promise<Role | null>;
}
