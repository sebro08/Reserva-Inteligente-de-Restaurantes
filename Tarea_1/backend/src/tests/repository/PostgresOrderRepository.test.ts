import { PostgresOrderRepository } from "../../repository/postgres/PostgresOrderRepository";

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
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
      if (entity.name === "Order") return mockRepo;
      if (entity.name === "User") return mockUserRepo;
      if (entity.name === "Restaurant") return mockRestaurantRepo;
      return mockRepo;
    },
  },
}));

describe("PostgresOrderRepository", () => {
  let repo: PostgresOrderRepository;

  beforeEach(() => {
    repo = new PostgresOrderRepository();
    jest.clearAllMocks();
  });

  test("findById success", async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1 });

    const result = await repo.findById(1);

    expect(result?.id).toBe(1);
  });

  test("findById null", async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const result = await repo.findById(1);

    expect(result).toBeNull();
  });

  test("create with relations", async () => {
    mockUserRepo.findOneBy.mockResolvedValue({ id: 1 });
    mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 2 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({
      user_id: 1,
      restaurant_id: 2,
      pickup: true,
    });

    expect(result.id).toBe(1);
  });

  test("create without relations", async () => {
    mockUserRepo.findOneBy.mockResolvedValue(null);
    mockRestaurantRepo.findOneBy.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({ pickup: false });

    expect(result.id).toBe(1);
  });
});