import { IRestaurantRepository } from "./IRestaurantRepository";
import { PostgresRestaurantRepository } from "./postgres/PostgresRestaurantRepository";
import { IUserRepository } from "./IUserRepository";
import { PostgresUserRepository } from "./postgres/PostgresUserRepository";
import { IRoleRepository } from "./IRoleRepository";
import { PostgresRoleRepository } from "./postgres/PostgresRoleRepository";
import { IMenuRepository } from "./IMenuRepository";
import { PostgresMenuRepository } from "./postgres/PostgresMenuRepository";
import { IOrderRepository } from "./IOrderRepository";
import { PostgresOrderRepository } from "./postgres/PostgresOrderRepository";
import { IReservationRepository } from "./IReservationRepository";
import { PostgresReservationRepository } from "./postgres/PostgresReservationRepository";

// Factory para crear instancias de repositorios según la configuración de la base de datos
const repositories = {
  postgres: {
    Restaurant: () => new PostgresRestaurantRepository(),
    User: () => new PostgresUserRepository(),
    Role: () => new PostgresRoleRepository(),
    Menu: () => new PostgresMenuRepository(),
    Order: () => new PostgresOrderRepository(),
    Reservation: () => new PostgresReservationRepository()
  },
  mongodb: {
    Restaurant: () => new (require("./mongo/MongoRestaurantRepository").MongoRestaurantRepository)(),
    User: () => new (require("./mongo/MongoUserRepository").MongoUserRepository)(),
    Role: () => new (require("./mongo/MongoRoleRepository").MongoRoleRepository)(),
    Menu: () => new (require("./mongo/MongoMenuRepository").MongoMenuRepository)(),
    Order: () => new (require("./mongo/MongoOrderRepository").MongoOrderRepository)(),
    Reservation: () => new (require("./mongo/MongoReservationRepository").MongoReservationRepository)()
  }
};

type EntityName = keyof typeof repositories.postgres;

export class RepositoryFactory {
  // Método para obtener la instancia del repositorio según la entidad
  private static getInstance<T>(entity: EntityName): T {
    const dbType = (process.env.DB_TYPE || "postgres") as keyof typeof repositories;

    if (!repositories[dbType]) {
      throw new Error(`Database type ${dbType} is not supported.`);
    }

    return repositories[dbType][entity]() as T;
  }
  
  static getRestaurantRepository(): IRestaurantRepository {
    return this.getInstance<IRestaurantRepository>("Restaurant");
  }

  static getUserRepository(): IUserRepository {
    return this.getInstance<IUserRepository>("User");
  }

  static getRoleRepository(): IRoleRepository {
    return this.getInstance<IRoleRepository>("Role");
  }

  static getMenuRepository(): IMenuRepository {
    return this.getInstance<IMenuRepository>("Menu");
  }

  static getOrderRepository(): IOrderRepository {
    return this.getInstance<IOrderRepository>("Order");
  }

  static getReservationRepository(): IReservationRepository {
    return this.getInstance<IReservationRepository>("Reservation");
  }
}
