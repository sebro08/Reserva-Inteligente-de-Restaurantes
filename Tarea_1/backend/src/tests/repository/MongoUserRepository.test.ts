import { MongoUserRepository } from "../../repository/mongo/MongoUserRepository";

const mockCollection = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  insertOne: jest.fn(),
};

jest.mock("../../database/mongo/MongoDatabase", () => ({
  MongoDatabase: {
    getDb: () => ({
      collection: () => mockCollection,
    }),
  },
}));

describe("MongoUserRepository FULL", () => {
  let repo: MongoUserRepository;

  beforeEach(() => {
    repo = new MongoUserRepository();
    jest.clearAllMocks();
  });

  test("findByKeycloakId found", async () => {
    mockCollection.findOne.mockResolvedValue({ _id: "x", id: 1 });

    const result = await repo.findByKeycloakId("abc");

    expect(result).toEqual({ id: 1 });
  });

  test("findByKeycloakId null", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const result = await repo.findByKeycloakId("abc");

    expect(result).toBeNull();
  });

  test("findByEmail returns mapped entity", async () => {
    mockCollection.findOne.mockResolvedValue({
      _id: "x",
      id: 10,
      email: "a@test.com",
    });

    const result = await repo.findByEmail("a@test.com");

    expect(result).toEqual({
      id: 10,
      email: "a@test.com",
    });
  });

  test("findById returns entity", async () => {
    mockCollection.findOne.mockResolvedValue({
      _id: "x",
      id: 55,
    });

    const result = await repo.findById(55);

    expect(result?.id).toBe(55);
  });

  test("update success", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue({
      _id: "x",
      id: 1,
      email: "updated@test.com",
    });

    const result = await repo.update(1, { email: "updated@test.com" });

    expect(result?.email).toBe("updated@test.com");
  });

  test("update returns null when no document", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue(null);

    const result = await repo.update(1, {});

    expect(result).toBeNull();
  });

  test("update returns null when undefined result", async () => {
    mockCollection.findOneAndUpdate.mockResolvedValue(undefined);

    const result = await repo.update(1, { email: "x@test.com" });

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
  test("create generates id only", async () => {
    mockCollection.insertOne.mockResolvedValue({});

    const result = await repo.create({ email: "test@test.com" });

    expect(result.id).toBeDefined();
  });
});