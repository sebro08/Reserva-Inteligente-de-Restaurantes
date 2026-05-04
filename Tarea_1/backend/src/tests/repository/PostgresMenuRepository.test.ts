import { PostgresMenuRepository } from "../../repository/postgres/PostgresMenuRepository";

const mockRepo = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  merge: jest.fn(),
};

const mockRestaurantRepo = {
  findOneBy: jest.fn(),
};

jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      if (entity.name === "Menu") return mockRepo;
      if (entity.name === "Restaurant") return mockRestaurantRepo;
      return mockRepo;
    },
  },
}));

describe("PostgresMenuRepository", () => {
  let repo: PostgresMenuRepository;

  beforeEach(() => {
    repo = new PostgresMenuRepository();
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

  test("create with restaurant", async () => {
    mockRestaurantRepo.findOneBy.mockResolvedValue({ id: 10 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({ name: "menu", restaurant_id: 10 });

    expect(result.id).toBe(1);
  });

  test("create without restaurant", async () => {
    mockRestaurantRepo.findOneBy.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({ name: "menu" });

    expect(result.id).toBe(1);
  });

  test("update success", async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: 1 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.update(1, { name: "updated" });

    expect(result?.id).toBe(1);
  });

  test("update null", async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    const result = await repo.update(1, { name: "x" });

    expect(result).toBeNull();
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