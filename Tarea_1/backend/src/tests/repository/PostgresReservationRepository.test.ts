import { PostgresReservationRepository } from "../../repository/postgres/PostgresReservationRepository";

const mockRepo = {
  save: jest.fn(),
  delete: jest.fn(),
};

const mockUserRepo = {
  findOneBy: jest.fn(),
};

const mockRestaurantRepo = {
  findOneBy: jest.fn(),
};

jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      if (entity.name === "Reservation") return mockRepo;
      if (entity.name === "User") return mockUserRepo;
      if (entity.name === "Restaurant") return mockRestaurantRepo;
      return mockRepo;
    },
  },
}));

describe("PostgresReservationRepository", () => {
  let repo: PostgresReservationRepository;

  beforeEach(() => {
    repo = new PostgresReservationRepository();
    jest.clearAllMocks();
  });

  test("create full relation", async () => {
    mockUserRepo.findOneBy.mockResolvedValue({ id: 1 });
    mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 2 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({
      user_id: 1,
      restaurant_id: 2,
      people_count: 3,
    });

    expect(result.id).toBe(1);
  });

  test("create without relations", async () => {
    mockUserRepo.findOneBy.mockResolvedValue(null);
    mockRestaurantRepo.findOneBy.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({ people_count: 2 });

    expect(result.id).toBe(1);
  });

  test("delete success", async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 });

    const result = await repo.delete(1);

    expect(result).toBe(true);
  });

  test("delete fail", async () => {
    mockRepo.delete.mockResolvedValue({ affected: 0 });

    const result = await repo.delete(1);

    expect(result).toBe(false);
  });
});