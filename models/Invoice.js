// import mongoose from "mongoose";

// const invoiceSchema = new mongoose.Schema({
//   packaging: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Packaging",
//   },

//   clientName: String,

//   items: [
//     {
//       inventory: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Inventory",
//       },
//       weight: Number,
//       pricePerCarat: Number,
//       amount: Number,
//     },
//   ],

//   subtotal: Number,
//   tax: Number,
//   totalAmount: Number,

//   status: {
//     type: String,
//     enum: ["paid", "unpaid"],
//     default: "unpaid",
//   },

// }, { timestamps: true });

// export default mongoose.model("Invoice", invoiceSchema);

import mongoose from "mongoose";

const revisionSchema = new mongoose.Schema({
  updatedAt: Date,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  previousSnapshot: Object,
});

const invoiceItemSchema = new mongoose.Schema({
  soldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sold",
    required: true,
  },
  serialNumber: String,
  category: String,
  weight: Number,
  weightUnit: String,
  pieces: Number,
  price: Number,
  currency: String,
  amount: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    buyer: String,

    items: [invoiceItemSchema], // ✅ MULTIPLE ITEMS

    subtotal: Number,

    taxRate: { type: Number, default: 0 },

    cgstAmount: Number,
    sgstAmount: Number,
    taxAmount: Number,

    totalAmount: Number,

    notes: String,

    paymentTerms: {
      type: String,
      default: "Payment due within 7 days",
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    // 🧾 Multiple sold items per invoice
    soldItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sold",
    }],

    revisionHistory: [revisionSchema],

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);

