import Inventory from "../models/inventoryModel.js";
import Packaging from "../models/Packaging.js";
import Invoice from "../models/Invoice.js";
import Sold from "../models/soldModel.js";
import Company from "../models/companyModel.js";
import { generateInvoicePDF } from "../utils/pdfService.js";
import Counter from "../models/Counter.js";

export const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "soldItem",
      populate: {
        path: "inventoryItem",
        populate: { path: "category" },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Fetch company info
    const company = await Company.findOne({ ownerId: req.user.ownerId });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    const doc = generateInvoicePDF(invoice, company);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};


async function generateInvoiceNumber(ownerId) {
  const year = new Date().getFullYear();

  // Get company name for prefix
  const company = await Company.findOne({ ownerId });
  const prefix = company?.companyName?.split(' ')[0]?.toUpperCase() || 'INV';

  const counter = await Counter.findOneAndUpdate(
    { name: `invoice-${ownerId}-${year}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.value).padStart(5, "0");
  return `${prefix}-${year}-${padded}`;
}

// export const getInvoiceBySold = async (req, res) => {
//   const invoice = await Invoice.findOne({
//     soldItem: req.params.soldId,
//   }).populate({
//     path: "soldItem",
//     populate: {
//       path: "inventoryItem",
//       populate: { path: "category" },
//     },
//   });

//   if (!invoice) {
//     return res.status(404).json({ message: "Invoice not found" });
//   }

//   res.json(invoice);
// };
export const getInvoiceBySold = async (req, res) => {
  try {
    const soldDoc = await Sold.findById(req.params.soldId).populate({
      path: "inventoryItem",
      populate: { path: "category" },
    });

    if (!soldDoc) {
      return res.status(404).json({ message: "Sold item not found" });
    }

    let invoice = await Invoice.findOne({ soldItem: soldDoc._id });

    // Auto-create invoice if missing
    if (!invoice) {
      const invoiceNumber = await generateInvoiceNumber(req.user.ownerId);

      // Get company for tax rate
      const company = await Company.findOne({ ownerId: req.user.ownerId });
      const taxRate = company?.taxRate || 0;

      const subtotal = soldDoc.price;
      const cgstAmount = (subtotal * (taxRate / 2)) / 100;
      const sgstAmount = cgstAmount;
      const totalAmount = subtotal + cgstAmount + sgstAmount;

      invoice = await Invoice.create({
        soldItem: soldDoc._id,
        invoiceNumber,
        buyer: soldDoc.buyer,
        currency: soldDoc.currency,
        subtotal,
        taxRate,
        cgstAmount,
        sgstAmount,
        taxAmount: cgstAmount + sgstAmount,
        totalAmount,
        ownerId: req.user.ownerId,
      });
    }

    const populatedInvoice = await Invoice.findById(invoice._id).populate({
      path: "soldItem",
      populate: {
        path: "inventoryItem",
        populate: { path: "category" },
      },
    });

    res.json(populatedInvoice);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
};


export const generateInvoice = async (req, res) => {
  const { packagingId, keptItemIds } = req.body;

  const packaging = await Packaging.findById(packagingId).populate("items.inventory");

  if (!packaging) {
    return res.status(404).json({ message: "Packaging not found" });
  }

  let invoiceItems = [];
  let subtotal = 0;

  for (const item of packaging.items) {
    const inventoryId = item.inventory._id.toString();

    // ✅ CLIENT KEPT THIS ITEM
    if (keptItemIds.includes(inventoryId)) {
      const amount = item.weight * item.pricePerCarat;
      subtotal += amount;

      invoiceItems.push({
        inventory: inventoryId,
        weight: item.weight,
        pricePerCarat: item.pricePerCarat,
        amount,
      });

      await Inventory.findByIdAndUpdate(inventoryId, {
        status: "sold",
      });
    }
    // ❌ CLIENT RETURNED THIS ITEM
    else {
      await Inventory.findByIdAndUpdate(inventoryId, {
        status: "available",
      });
    }
  }

  const invoice = await Invoice.create({
    packaging: packagingId,
    clientName: packaging.clientName,
    items: invoiceItems,
    subtotal,
    totalAmount: subtotal,
  });

  packaging.status =
    invoiceItems.length === 0
      ? "returned"
      : invoiceItems.length === packaging.items.length
      ? "sold"
      : "partially_sold";

  await packaging.save();

  res.json(invoice);
};
