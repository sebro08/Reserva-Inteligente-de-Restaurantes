import { PostgresRestaurantRepository } from "../../repository/postgres/PostgresRestaurantRepository";

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockUserRepo = {
  findOneBy: jest.fn(),
};

const mockLocationRepo = {
  findOneBy: jest.fn(),
};

jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      if (entity.name === "Restaurant") return mockRepo;
      if (entity.name === "User") return mockUserRepo;
      if (entity.name === "Location") return mockLocationRepo;
      return mockRepo;
    },
  },
}));

describe("PostgresRestaurantRepository", () => {
  let repo: PostgresRestaurantRepository;

  beforeEach(() => {
    repo = new PostgresRestaurantRepository();
    jest.clearAllMocks();
  });

  test("findAll", async () => {
    mockRepo.find.mockResolvedValue([{ id: 1 }]);

    const result = await repo.findAll();

    expect(result.length).toBe(1);
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

  test("create full relations", async () => {
    mockUserRepo.findOneBy.mockResolvedValue({ id: 1 });
    mockLocationRepo.findOneBy.mockResolvedValue({ id: 2 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({
      admin_id: 1,
      location_id: 2,
      name: "rest",
    });

    expect(result.id).toBe(1);
  });

  test("create without relations", async () => {
    mockUserRepo.findOneBy.mockResolvedValue(null);
    mockLocationRepo.findOneBy.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({ name: "rest" });

    expect(result.id).toBe(1);
  });

  test("update success", async () => {
    mockRepo.findOne.mockResolvedValue({ id: 1 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.update(1, { name: "updated" });

    expect(result?.id).toBe(1);
  });

  test("update null", async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const result = await repo.update(1, {});

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