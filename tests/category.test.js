import request from "supertest";
import app from "../app";
import mongoose from "mongoose";

describe("Category API", () => {
  let token;

  beforeAll(async () => {
    // login
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "123456" });

    token = res.body.accessToken;
  });

  it("should create a category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "RUBY" });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe("RUBY");
  });

  it("should not allow duplicate category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "RUBY" });

    expect(res.statusCode).toBe(409);
  });
});