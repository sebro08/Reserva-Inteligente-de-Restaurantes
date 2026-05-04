import request from "supertest";
import { app } from "../src/index";

describe("Auth Integration Tests", () => {

  describe("POST /auth/register", () => {
    it("should not crash the server", async () => {
      const res = await request(app).post("/auth/register").send({
        first_name: "Juan",
        last_name: "Perez",
        email: "test@test.com",
        password: "123456"
      });

      expect(res.statusCode).not.toBe(500);
    });
  });

  describe("GET /health", () => {
    it("should return OK", async () => {
      const res = await request(app).get("/health");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("status", "ok");
    });
  });

});