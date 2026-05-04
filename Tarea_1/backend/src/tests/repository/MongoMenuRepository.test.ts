import { MongoMenuRepository } from "../../repository/mongo/MongoMenuRepository";

const mockCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
};

jest.mock("../../database/mongo/MongoDatabase", () => ({
  MongoDatabase: {
    getDb: () => ({
      collection: () => mockCollection,
    }),
  },
}));

describe("MongoMenuRepository FULL", () => {
  let repo: MongoMenuRepository;

  beforeEach(() => {
    repo = new MongoMenuRepository();
    jest.clearAllMocks();
  });

  test("findById found", async () => {
    mockCollection.findOne.mockResolvedValue({ _id: "x", id: 1, name: "Menu" });

    const result = await repo.findById(1);

    expect(result).toEqual({ id: 1, name: "Menu" });
  });

  test("findById null", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const result = await repo.findById(1);

    expect(result).toBeNull();
  });

  test("create", async () => {
    mockCollection.insertOne.mockResolvedValue({});

    const result = await repo.create({ name: "Test" });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Test");
  });

  test("update success", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue({
      _id: "x",
      id: 1,
      name: "Updated",
    });

    const result = await repo.update(1, { name: "Updated" });

    expect(result?.name).toBe("Updated");
  });

  test("update null", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue(null);

    const result = await repo.update(1, {});

    expect(result).toBeNull();
  });

  test("delete true", async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    expect(await repo.delete(1)).toBe(true);
  });

  test("delete false", async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    expect(await repo.delete(1)).toBe(false);
  });
});