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

const invoiceSchema = new mongoose.Schema(
  {
    soldItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sold",
      required: true,
      unique: true,
      index: true,
    },

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

    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR"],
      required: true,
    },

    items: [
      {
        name: String,
        category: String,
        weight: String,
        price: Number,
      },
    ],

    subtotal: Number,
    taxRate: { type: Number, default: 0 },
    taxType: {
      type: String,
      enum: ["cgst_sgst", "igst"],
      default: "cgst_sgst",
    },
    cgstAmount: Number,
    sgstAmount: Number,
    taxAmount: Number,
    totalAmount: Number,
    notes: String,
    paymentTerms: {
      type: String,
      default: "Payment due within 7 days",
    },

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

