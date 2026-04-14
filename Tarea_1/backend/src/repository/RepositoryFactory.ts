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

export class RepositoryFactory {
  // Cuando ya implementemos MongoDB, devolvemos instanciaciones según el .env
  
  static getRestaurantRepository(): IRestaurantRepository {
    const dbType = process.env.DB_TYPE || "postgres";

    if (dbType === "postgres") {
      return new PostgresRestaurantRepository();
    } 
    
    if (dbType === "mongodb") {
      const { MongoRestaurantRepository } = require("./mongo/MongoRestaurantRepository");
      return new MongoRestaurantRepository();
    }

    throw new Error(`Database type ${dbType} is not supported.`);
  }

  static getUserRepository(): IUserRepository {
    const dbType = process.env.DB_TYPE || "postgres";

    if (dbType === "postgres") {
      return new PostgresUserRepository();
    }

    if (dbType === "mongodb") {
      const { MongoUserRepository } = require("./mongo/MongoUserRepository");
      return new MongoUserRepository();
    }

    throw new Error(`Database type ${dbType} is not supported.`);
  }

  static getRoleRepository(): IRoleRepository {
    const dbType = process.env.DB_TYPE || "postgres";

    if (dbType === "postgres") {
      return new PostgresRoleRepository();
    }

    if (dbType === "mongodb") {
      const { MongoRoleRepository } = require("./mongo/MongoRoleRepository");
      return new MongoRoleRepository();
    }

    throw new Error(`Database type ${dbType} is not supported.`);
  }

  static getMenuRepository(): IMenuRepository {
    const dbType = process.env.DB_TYPE || "postgres";

    if (dbType === "postgres") {
      return new PostgresMenuRepository();
    }

    if (dbType === "mongodb") {
      const { MongoMenuRepository } = require("./mongo/MongoMenuRepository");
      return new MongoMenuRepository();
    }

    throw new Error(`Database type ${dbType} is not supported.`);
  }

  static getOrderRepository(): IOrderRepository {
    const dbType = process.env.DB_TYPE || "postgres";

    if (dbType === "postgres") {
      return new PostgresOrderRepository();
    }

    if (dbType === "mongodb") {
      const { MongoOrderRepository } = require("./mongo/MongoOrderRepository");
      return new MongoOrderRepository();
    }

    throw new Error(`Database type ${dbType} is not supported.`);
  }

  static getReservationRepository(): IReservationRepository {
    const dbType = process.env.DB_TYPE || "postgres";

    if (dbType === "postgres") {
      return new PostgresReservationRepository();
    }

    if (dbType === "mongodb") {
      const { MongoReservationRepository } = require("./mongo/MongoReservationRepository");
      return new MongoReservationRepository();
    }

    throw new Error(`Database type ${dbType} is not supported.`);
  }
}
