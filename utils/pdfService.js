import PDFDocument from "pdfkit";
import path from "path";
import process from "process";

export const generateInvoicePDF = (invoice, company) => {
  const doc = new PDFDocument({ margin: 50 });

  // ✅ Currency formatter (USED)
  const formatCurrency = (amount, currency) => {
    const symbols = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
    return `${symbols[currency] || currency} ${Number(amount || 0).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  /* ======================
      HEADER (LOGO + COMPANY)
  ====================== */

  if (company?.logoUrl) {
    try {
      const logoPath = path.join(process.cwd(), company.logoUrl);
      doc.image(logoPath, 50, 45, { width: 80 });
    } catch (err) {
      console.log("⚠️ Company logo not found:", err.message);
    }
  }

  doc.fontSize(20).text(company?.companyName || "Company Name", 150, 50);
  doc.fontSize(10).text(company?.address || "", 150, 75);
  doc.text(`GSTIN: ${company?.gstNumber || "-"}`, 150, 90);
  doc.text(`Phone: ${company?.phone || "-"}`, 150, 105);
  doc.text(`Email: ${company?.email || "-"}`, 150, 120);

  /* ======================
        INVOICE META
  ====================== */

  doc.fontSize(16).text("TAX INVOICE", 400, 50, { align: "right" });
  doc
    .fontSize(10)
    .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 75, { align: "right" })
    .text(
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`,
      400,
      90,
      { align: "right" }
    );

  doc.moveTo(50, 150).lineTo(550, 150).stroke();

  /* ======================
          BILL TO
  ====================== */

  doc.fontSize(12).text("Bill To:", 50, 170);
  doc.fontSize(10).text(invoice.buyer || "Walk-in Customer", 50, 190);

  /* ======================
        ITEMS TABLE
  ====================== */

  const tableTop = 250;

  doc.fontSize(10).text("Description", 50, tableTop);
  doc.text("Category", 200, tableTop);
  doc.text("Weight", 320, tableTop);
  doc.text("Amount", 450, tableTop, { align: "right" });

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 30;

  // Handle both new format (items array) and old format (soldItem)
  if (invoice.items && invoice.items.length > 0) {
    // New format: multiple items
    invoice.items.forEach((item, index) => {
      doc.text(item.serialNumber, 50, y);
      doc.text(item.category || "-", 200, y);
      doc.text(`${item.weight} ${item.weightUnit}`, 320, y);
      doc.text(formatCurrency(item.amount, invoice.currency || "INR"), 450, y, {
        align: "right",
      });

      y += 25;
    });
  } else if (invoice.soldItem) {
    // Old format: single item
    const item = invoice.soldItem.inventoryItem;
    if (item) {
      doc.text(item.serialNumber || "-", 50, y);
      doc.text(item.category?.name || "-", 200, y);
      doc.text(
        `${item.weight || "-"} ${item.weightUnit || ""}`,
        320,
        y
      );
      doc.text(
        formatCurrency(invoice.subtotal, invoice.currency || "INR"),
        450,
        y,
        { align: "right" }
      );
      y += 25;
    }
  }

  /* ======================
            TOTALS
  ====================== */

  // Calculate position based on number of items
  const itemsCount = (invoice.items && invoice.items.length > 0) ? invoice.items.length : (invoice.soldItem ? 1 : 0);
  const tableHeight = Math.max(itemsCount, 1) * 25; // 25px per item
  const totalsY = tableTop + 30 + tableHeight + 30; // +30 for padding

  doc.moveTo(350, totalsY - 10).lineTo(550, totalsY - 10).stroke();

  doc.text("Subtotal:", 350, totalsY);
  doc.text(
    formatCurrency(invoice.subtotal, invoice.currency || "INR"),
    450,
    totalsY,
    { align: "right" }
  );

  if (invoice.taxRate > 0) {
    const cgstRate = invoice.taxRate / 2;
    const cgstAmount = invoice.cgstAmount || (invoice.subtotal * cgstRate) / 100;
    const sgstAmount = invoice.sgstAmount || cgstAmount;

    doc.text(`CGST (${cgstRate.toFixed(2)}%):`, 350, totalsY + 20);
    doc.text(
      formatCurrency(cgstAmount, invoice.currency || "INR"),
      450,
      totalsY + 20,
      { align: "right" }
    );

    doc.text(`SGST (${cgstRate.toFixed(2)}%):`, 350, totalsY + 40);
    doc.text(
      formatCurrency(sgstAmount, invoice.currency || "INR"),
      450,
      totalsY + 40,
      { align: "right" }
    );
  }

  doc.moveTo(350, totalsY + 65).lineTo(550, totalsY + 65).stroke();

  doc.fontSize(12).text("Total:", 350, totalsY + 75);
  doc.text(
    formatCurrency(invoice.totalAmount, invoice.currency || "INR"),
    450,
    totalsY + 75,
    { align: "right" }
  );

  /* ======================
            FOOTER
  ====================== */

  if (invoice.notes) {
    doc.fontSize(10).text("Notes:", 50, totalsY + 120);
    doc
      .fontSize(9)
      .text(invoice.notes, 50, totalsY + 135, { width: 500 });
  }

  // ✍️ Signature
  if (company?.signatureUrl) {
    try {
      const signPath = path.join(process.cwd(), company.signatureUrl);
      doc.image(signPath, 400, 650, { width: 100 });
    } catch (err) {
      console.log("⚠️ Signature not found:", err.message);
    }
  }

  doc.fontSize(10).text("Authorized Signature", 400, 720);

  return doc;
};
