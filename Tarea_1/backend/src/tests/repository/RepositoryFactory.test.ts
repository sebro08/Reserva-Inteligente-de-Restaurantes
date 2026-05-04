import { RepositoryFactory } from "../../repository/RepositoryFactory";

describe("RepositoryFactory FULL", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("default = postgres (todos los repos)", () => {
    process.env.DB_TYPE = "postgres";

    expect(RepositoryFactory.getRestaurantRepository().constructor.name)
      .toBe("PostgresRestaurantRepository");

    expect(RepositoryFactory.getUserRepository().constructor.name)
      .toBe("PostgresUserRepository");

    expect(RepositoryFactory.getRoleRepository().constructor.name)
      .toBe("PostgresRoleRepository");

    expect(RepositoryFactory.getMenuRepository().constructor.name)
      .toBe("PostgresMenuRepository");

    expect(RepositoryFactory.getOrderRepository().constructor.name)
      .toBe("PostgresOrderRepository");

    expect(RepositoryFactory.getReservationRepository().constructor.name)
      .toBe("PostgresReservationRepository");
  });

  test("mongodb (todos los repos)", () => {
    process.env.DB_TYPE = "mongodb";

    expect(RepositoryFactory.getRestaurantRepository().constructor.name)
      .toBe("MongoRestaurantRepository");

    expect(RepositoryFactory.getUserRepository().constructor.name)
      .toBe("MongoUserRepository");

    expect(RepositoryFactory.getRoleRepository().constructor.name)
      .toBe("MongoRoleRepository");

    expect(RepositoryFactory.getMenuRepository().constructor.name)
      .toBe("MongoMenuRepository");

    expect(RepositoryFactory.getOrderRepository().constructor.name)
      .toBe("MongoOrderRepository");

    expect(RepositoryFactory.getReservationRepository().constructor.name)
      .toBe("MongoReservationRepository");
  });

  test("unsupported DB en TODOS", () => {
    process.env.DB_TYPE = "invalid";

    expect(() => RepositoryFactory.getRestaurantRepository()).toThrow();
    expect(() => RepositoryFactory.getUserRepository()).toThrow();
    expect(() => RepositoryFactory.getRoleRepository()).toThrow();
    expect(() => RepositoryFactory.getMenuRepository()).toThrow();
    expect(() => RepositoryFactory.getOrderRepository()).toThrow();
    expect(() => RepositoryFactory.getReservationRepository()).toThrow();
  });
});