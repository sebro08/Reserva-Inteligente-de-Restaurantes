import { MongoReservationRepository } from "../../repository/mongo/MongoReservationRepository";

const mockCollection = {
  insertOne: jest.fn(),
  deleteOne: jest.fn(),
  findOne: jest.fn(),
};

jest.mock("../../database/mongo/MongoDatabase", () => ({
  MongoDatabase: {
    getDb: () => ({
      collection: () => mockCollection,
    }),
  },
}));

describe("MongoReservationRepository", () => {
  let repo: MongoReservationRepository;

  beforeEach(() => {
    repo = new MongoReservationRepository();
    jest.clearAllMocks();
  });

  test("create inserts reservation and returns entity", async () => {
    mockCollection.insertOne.mockResolvedValue({ acknowledged: true });

    const input = {
      user_id: 1,
      restaurant_id: 2,
      reservation_date: new Date(),
      reservation_time: "20:00",
      people_count: 4,
    } as any;

    const result = await repo.create(input);

    expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");

    expect(result.user).toBeUndefined();
    expect(result.restaurant).toBeUndefined();
  });

  test("create works with empty input", async () => {
    mockCollection.insertOne.mockResolvedValue({ acknowledged: true });

    const result = await repo.create({} as any);

    expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
    expect(typeof result.id).toBe("number");
  });

  test("delete returns true when deletedCount === 1", async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await repo.delete(10);

    expect(mockCollection.deleteOne).toHaveBeenCalledWith({ id: 10 });
    expect(result).toBe(true);
  });

  test("delete returns false when deletedCount === 0", async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    const result = await repo.delete(10);

    expect(result).toBe(false);
  });

  test("delete handles missing deletedCount safely", async () => {
    mockCollection.deleteOne.mockResolvedValue({});

    const result = await repo.delete(10);

    expect(result).toBe(false);
  });

  // 🔥 ESTE ES EL QUE TE SUBE EL COVERAGE (mapEntity INDIRECTO)
  test("findById executes mapEntity and removes _id", async () => {
    mockCollection.findOne.mockResolvedValue({
      _id: "mongo-id",
      id: 123,
      user_id: 1,
      restaurant_id: 2,
      reservation_time: "20:00",
    });

    const result = await repo.findById(123);

    expect(mockCollection.findOne).toHaveBeenCalledWith({ id: 123 });

    expect(result).toEqual({
      id: 123,
      user_id: 1,
      restaurant_id: 2,
      reservation_time: "20:00",
    });

    // confirma que mapEntity eliminó _id
    expect((result as any)._id).toBeUndefined();
  });

  test("findById returns null when not found", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const result = await repo.findById(999);

    expect(result).toBeNull();
  });
});