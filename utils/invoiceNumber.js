import Counter from "../models/Counter.js";

export async function getNextInvoiceNumber() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `invoice-${year}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.value).padStart(5, "0");

  return `KUBER-${year}-${padded}`;
}
