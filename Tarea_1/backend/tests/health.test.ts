import request from "supertest";
import { app } from "../src/index";

describe("Health Endpoint", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });
});