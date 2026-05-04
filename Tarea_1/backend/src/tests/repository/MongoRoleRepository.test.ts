import { MongoRoleRepository } from "../../repository/mongo/MongoRoleRepository";

const mockCollection = {
  findOne: jest.fn(),
};

jest.mock("../../database/mongo/MongoDatabase", () => ({
  MongoDatabase: {
    getDb: () => ({
      collection: () => mockCollection,
    }),
  },
}));

describe("MongoRoleRepository", () => {
  let repo: MongoRoleRepository;

  beforeEach(() => {
    repo = new MongoRoleRepository();
    jest.clearAllMocks();
  });

  test("findByName found", async () => {
    mockCollection.findOne.mockResolvedValue({ _id: "1", name: "ADMIN" });

    const result = await repo.findByName("ADMIN");

    expect(result?.name).toBe("ADMIN");
  });

  test("findByName null", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const result = await repo.findByName("ADMIN");

    expect(result).toBeNull();
  });
});