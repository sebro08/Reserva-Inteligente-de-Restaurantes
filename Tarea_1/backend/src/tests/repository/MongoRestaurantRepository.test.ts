import { MongoRestaurantRepository } from "../../repository/mongo/MongoRestaurantRepository";

const mockCollection = {
  find: jest.fn(),
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

describe("MongoRestaurantRepository", () => {
  let repo: MongoRestaurantRepository;

  beforeEach(() => {
    repo = new MongoRestaurantRepository();
    jest.clearAllMocks();
  });

  test("findAll maps entities", async () => {
    mockCollection.find.mockReturnValue({
      toArray: () => Promise.resolve([{ _id: "1", id: 1 }]),
    });

    const result = await repo.findAll();

    expect(result).toEqual([{ id: 1 }]);
  });

  test("findById found", async () => {
    mockCollection.findOne.mockResolvedValue({ _id: "1", id: 10 });

    const result = await repo.findById(10);

    expect(result?.id).toBe(10);
  });

  test("findById null", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const result = await repo.findById(10);

    expect(result).toBeNull();
  });

  test("create restaurant", async () => {
    mockCollection.insertOne.mockResolvedValue({});

    const result = await repo.create({ name: "Test" } as any);

    expect(result.id).toBeDefined();
    expect(mockCollection.insertOne).toHaveBeenCalled();
  });

  test("update returns mapped entity", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue({
      _id: "1",
      id: 99,
      name: "Updated",
    });

    const result = await repo.update(99, { name: "Updated" });

    expect(result?.name).toBe("Updated");
  });

  test("update returns null", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue(null);

    const result = await repo.update(99, {});

    expect(result).toBeNull();
  });

  test("delete success", async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await repo.delete(1);

    expect(result).toBe(true);
  });

  test("delete fail", async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    const result = await repo.delete(1);

    expect(result).toBe(false);
  });
});