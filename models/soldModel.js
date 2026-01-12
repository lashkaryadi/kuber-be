// import db from '../database.js';

// export function getAll() {
//   return db.prepare(`SELECT s.*, i.serialNumber, i.category FROM sold s LEFT JOIN inventory i ON s.inventoryId = i.id`).all();
// }

// export function getById(id) {
//   return db.prepare(`SELECT s.*, i.serialNumber, i.category FROM sold s LEFT JOIN inventory i ON s.inventoryId = i.id WHERE s.id = ?`).get(id);
// }

// export function create(sold) {
//   const stmt = db.prepare(`INSERT INTO sold (inventoryId, serialNumber, soldDate) VALUES (?, ?, ?)`);
//   const info = stmt.run(sold.inventoryId, sold.serialNumber, sold.soldDate);
//   return { id: info.lastInsertRowid, ...sold };
// }


import mongoose from "mongoose";

const soldSchema = new mongoose.Schema(
  {
    // 🔗 Reference to inventory item (NO UNIQUE CONSTRAINT)
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true, // ✅ Index for fast lookups
    },

    // 📦 Quantity details (for partial sales)
    soldPieces: {
      type: Number,
      required: true,
      min: [0.01, "Sold pieces must be positive"], // ✅ Validation
    },

    soldWeight: {
      type: Number,
      required: true,
      min: [0.01, "Sold weight must be positive"], // ✅ Validation
    },

    // 💰 Sale details
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    // ✅ CRITICAL: Store total price separately to avoid floating-point errors
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },

    currency: {
      type: String,
      required: true,
      enum: ["USD", "EUR", "GBP", "INR"],
      default: "USD",
    },

    soldDate: {
      type: Date,
      required: true,
      index: true, // ✅ Index for date range queries
    },

    buyer: {
      type: String,
      trim: true,
      maxlength: [200, "Buyer name too long"],
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ Critical for multi-tenant filtering
    },

    // 💰 Financial tracking (optional, for profit reports)
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
    },

    profit: {
      type: Number,
    },

    // 🔒 Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
  soldSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
})

/* =========================
   PERFORMANCE INDEXES
========================= */

// ✅ Composite indexes for multi-tenant queries
soldSchema.index({ ownerId: 1, soldDate: -1 }); // For analytics queries
soldSchema.index({ ownerId: 1, inventoryItem: 1 }); // For inventory history
soldSchema.index({ ownerId: 1, isDeleted: 1, createdAt: -1 }); // For list views


export default mongoose.model("Sold", soldSchema);
