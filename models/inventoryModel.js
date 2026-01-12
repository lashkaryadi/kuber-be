// import db from '../database.js';

// export function getAll() {
//   return db.prepare('SELECT * FROM inventory').all();
// }

// export function getById(id) {
//   return db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
// }

// export function create(item) {
//   const stmt = db.prepare(`INSERT INTO inventory
//     (serialNumber, category, pieces, weight, dimensions, certification, location, approvalStatus)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
//   const info = stmt.run(
//     item.serialNumber, item.category, item.pieces, item.weight,
//     item.dimensions, item.certification, item.location, item.approvalStatus
//   );
//   return { id: info.lastInsertRowid, ...item };
// }

// export function update(id, changes) {
//   const stmt = db.prepare(`UPDATE inventory SET
//     serialNumber = ?, category = ?, pieces = ?, weight = ?,
//     dimensions = ?, certification = ?, location = ?, approvalStatus = ?
//     WHERE id = ?`);
//   const info = stmt.run(
//     changes.serialNumber, changes.category, changes.pieces, changes.weight,
//     changes.certification, changes.location, changes.approvalStatus, id
//   );
//   return info.changes;
// }

// export function remove(id) {
//   const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
//   const info = stmt.run(id);
//   return info.changes;
// }

import mongoose from "mongoose";
import Sold from "./soldModel.js";
import Invoice from "./Invoice.js";
const inventorySchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Serial number too long"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // ✅ CRITICAL: Separate total and available quantities
    totalPieces: {
      type: Number,
      required: true,
      min: [0, "Total pieces cannot be negative"],
    },

    availablePieces: {
      type: Number,
      required: true,
      min: [0, "Available pieces cannot be negative"],
    },

    totalWeight: {
      type: Number,
      required: true,
      min: [0, "Total weight cannot be negative"],
    },

    availableWeight: {
      type: Number,
      required: true,
      min: [0, "Available weight cannot be negative"],
    },

    weightUnit: {
      type: String,
      enum: ["carat", "gram"],
      required: true,
    },

    /* 🔥 NEW REQUIRED FIELDS */
    purchaseCode: {
      type: String,
      required: true,
      trim: true,
    },

    saleCode: {
      type: String,
      required: true,
      trim: true,
    },

    /* ❌ NOT REQUIRED ANYMORE */

    dimensions: {
      length: {
        type: Number,
      },
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ["mm", "cm", "inch"],
        default: "mm",
      },
    },

    location: {
      type: String,
    },

    certification: String,

    status: {
      type: String,
      enum: ["pending", "in_stock", "partially_sold", "sold"],
      default: "pending",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    description: String,
    images: [String],
  },
  { timestamps: true }
);

inventorySchema.index({ isDeleted: 1 });

// ✅ Unique serial per owner
inventorySchema.index(
  { ownerId: 1, serialNumber: 1 },
  { unique: true }
);

// ✅ Validation middleware
inventorySchema.pre("save", function(next) {
  // Ensure available doesn't exceed total
  if (this.availablePieces > this.totalPieces) {
    return next(new Error("Available pieces cannot exceed total pieces"));
  }

  if (this.availableWeight > this.totalWeight) {
    return next(new Error("Available weight cannot exceed total weight"));
  }

  // ✅ AUTO-UPDATE STATUS based on availability
  if (this.availablePieces === 0 || this.availableWeight === 0) {
    this.status = "sold";
  } else if (
    this.availablePieces < this.totalPieces ||
    this.availableWeight < this.totalWeight
  ) {
    this.status = "partially_sold";
  } else if (this.status === "sold" || this.status === "partially_sold") {
    // If fully restored, set back to in_stock
    this.status = "in_stock";
  }

  next();
});

inventorySchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id;

    // ✅ BACKWARD COMPATIBILITY: Map new fields to old field names
    if (ret.totalPieces !== undefined) {
      ret.pieces = ret.availablePieces ?? ret.totalPieces;
    }
    if (ret.totalWeight !== undefined) {
      ret.weight = ret.availableWeight ?? ret.totalWeight;
    }

    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

inventorySchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    const sold = await Sold.findOne({ inventoryItem: this._id });

    if (sold) {
      await Invoice.findOneAndDelete({ soldItem: sold._id });
      await sold.deleteOne();
    }

    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Inventory", inventorySchema);
