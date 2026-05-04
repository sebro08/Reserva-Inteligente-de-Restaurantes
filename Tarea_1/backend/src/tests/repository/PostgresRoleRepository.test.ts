import { PostgresRoleRepository } from "../../repository/postgres/PostgresRoleRepository";

const mockRepo = {
  findOneBy: jest.fn(),
};

jest.mock("../../database/data-source", () => ({
  AppDataSource: {
    getRepository: () => mockRepo,
  },
}));

describe("PostgresRoleRepository", () => {
  let repo: PostgresRoleRepository;

  beforeEach(() => {
    repo = new PostgresRoleRepository();
    jest.clearAllMocks();
  });

  test("findByName returns role", async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: 1, name: "ADMIN" });

    const result = await repo.findByName("ADMIN");

    expect(result?.name).toBe("ADMIN");
  });

  test("findByName returns null", async () => {
    mockRepo.findOneBy.mockResolvedValue(null);

    const result = await repo.findByName("ADMIN");

    expect(result).toBeNull();
  });
});