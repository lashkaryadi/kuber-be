import request from "supertest";
import app from "../app";

describe("Inventory API", () => {
  it("should reject invalid category id", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .query({ category: "EMERALD" });

    expect(res.statusCode).toBe(400);
  });
});