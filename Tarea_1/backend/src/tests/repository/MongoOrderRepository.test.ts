import { MongoOrderRepository } from "../../repository/mongo/MongoOrderRepository";

const mockCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
};

jest.mock("../../database/mongo/MongoDatabase", () => ({
  MongoDatabase: {
    getDb: () => ({
      collection: () => mockCollection,
    }),
  },
}));

describe("MongoOrderRepository", () => {
  let repo: MongoOrderRepository;

  beforeEach(() => {
    repo = new MongoOrderRepository();
    jest.clearAllMocks();
  });

  test("findById returns order", async () => {
    mockCollection.findOne.mockResolvedValue({ id: 1 });

    const result = await repo.findById(1);

    expect(result).toEqual({ id: 1 });
  });

  test("findById returns null if not found", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const result = await repo.findById(1);

    expect(result).toBeNull();
  });

  test("create inserts and returns order", async () => {
    mockCollection.insertOne.mockResolvedValue({});

    const result = await repo.create({} as any);

    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
  
  test("mapEntity removes _id", async () => {
  mockCollection.findOne.mockResolvedValue({ _id: "mongo", id: 1 });

  const result = await repo.findById(1);

  expect(result).toEqual({ id: 1 });
    });
});