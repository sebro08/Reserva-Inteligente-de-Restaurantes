import { PostgresUserRepository } from "../../repository/postgres/PostgresUserRepository";

const mockRepo = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
};

jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: () => mockRepo,
  },
}));

describe("PostgresUserRepository", () => {
  let repo: PostgresUserRepository;

  beforeEach(() => {
    repo = new PostgresUserRepository();
    jest.clearAllMocks();
  });

  test("findByKeycloakId returns user", async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: 1 });

    const result = await repo.findByKeycloakId("abc");

    expect(result?.id).toBe(1);
  });

  test("findByKeycloakId null", async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    const result = await repo.findByKeycloakId("abc");

    expect(result).toBeNull();
  });

  test("findById returns user", async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: 10 });

    const result = await repo.findById(10);

    expect(result?.id).toBe(10);
  });

  test("findByEmail returns user", async () => {
    mockRepo.findOneBy.mockResolvedValue({ email: "test@test.com" });

    const result = await repo.findByEmail("test@test.com");

    expect(result?.email).toBe("test@test.com");
  });

  test("create user", async () => {
    mockRepo.create.mockReturnValue({ id: 1 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.create({ email: "x@test.com" });

    expect(result.id).toBe(1);
  });

  test("update success", async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: 1 });
    mockRepo.save.mockResolvedValue({ id: 1 });

    const result = await repo.update(1, { email: "new@test.com" });

    expect(result?.id).toBe(1);
  });

  test("update returns null when user not found", async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    const result = await repo.update(1, { email: "x@test.com" });

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