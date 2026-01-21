import request from "supertest";
import { app } from "../app.js";
import Inventory from "../models/Inventory.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Mock user data for testing
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  username: "testuser",
  email: "test@example.com",
  role: "admin",
  ownerId: new mongoose.Types.ObjectId()
};

describe("Update Inventory API", () => {
  let authToken;
  let categoryId;
  let inventoryId;

  beforeAll(async () => {
    // Clean up any existing test data
    await Inventory.deleteMany({ ownerId: mockUser.ownerId });
    await Category.deleteMany({ ownerId: mockUser.ownerId });
  });

  afterAll(async () => {
    // Clean up test data
    await Inventory.deleteMany({ ownerId: mockUser.ownerId });
    await Category.deleteMany({ ownerId: mockUser.ownerId });
  });

  test("should create a category for testing", async () => {
    const response = await request(app)
      .post("/api/categories")
      .send({
        name: "Test Diamond",
        code: "TD"
      })
      .expect(201);

    categoryId = response.body.data._id;
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Test Diamond");
  });

  test("should create an inventory item for testing", async () => {
    const response = await request(app)
      .post("/api/inventory")
      .send({
        category: categoryId,
        shapeType: "single",
        singleShape: "Round",
        totalPieces: 10,
        totalWeight: 5.5,
        purchaseCode: "PURCHASE123",
        saleCode: "SALE123",
        certification: "GIA",
        location: "Vault A",
        status: "in_stock",
        description: "Test diamond inventory"
      })
      .expect(201);

    inventoryId = response.body.data._id;
    expect(response.body.success).toBe(true);
    expect(response.body.data.serialNumber).toBeDefined();
    expect(response.body.data.singleShape).toBe("Round");
  });

  test("should update an inventory item with single shape", async () => {
    const response = await request(app)
      .put(`/api/inventory/${inventoryId}`)
      .send({
        category: categoryId,
        shapeType: "single",
        singleShape: "Princess",
        totalPieces: 15,
        totalWeight: 7.5,
        purchaseCode: "UPDATED_PURCHASE",
        saleCode: "UPDATED_SALE",
        certification: "IGI",
        location: "Vault B",
        status: "pending",
        description: "Updated test diamond inventory"
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.singleShape).toBe("Princess");
    expect(response.body.data.totalPieces).toBe(15);
    expect(response.body.data.totalWeight).toBe(7.5);
    expect(response.body.data.purchaseCode).toBe("UPDATED_PURCHASE");
  });

  test("should update an inventory item to mix shape type", async () => {
    const response = await request(app)
      .put(`/api/inventory/${inventoryId}`)
      .send({
        shapeType: "mix",
        shapes: [
          { shape: "Round", pieces: 5, weight: 2.5 },
          { shape: "Emerald", pieces: 3, weight: 1.8 }
        ],
        totalPieces: 8, // This should be recalculated by the pre-save hook
        totalWeight: 4.3 // This should be recalculated by the pre-save hook
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.shapeType).toBe("mix");
    expect(response.body.data.shapes).toHaveLength(2);
    expect(response.body.data.singleShape).toBeNull(); // Should be null for mix type
    // The totalPieces and totalWeight should be recalculated based on shapes
    expect(response.body.data.totalPieces).toBe(8); // 5 + 3
    expect(response.body.data.totalWeight).toBeCloseTo(4.3); // 2.5 + 1.8
  });

  test("should fail to update with invalid shape type", async () => {
    const response = await request(app)
      .put(`/api/inventory/${inventoryId}`)
      .send({
        shapeType: "invalid_shape_type"
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid shape type");
  });

  test("should fail to update single shape without required fields", async () => {
    const response = await request(app)
      .put(`/api/inventory/${inventoryId}`)
      .send({
        shapeType: "single",
        singleShape: "Marquise"
        // Missing totalPieces and totalWeight
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Total pieces and weight are required");
  });
});