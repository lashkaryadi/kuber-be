import Inventory from "../models/inventoryModel.js";
import Sold from "../models/soldModel.js";

/**
 * GET /api/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    /* ---------------- COUNTS ---------------- */
    const [
      totalInventory,
      approvedItems,
      soldItems,
      pendingApproval,
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ status: "approved" }),
      Sold.countDocuments(),
      Inventory.countDocuments({ status: "pending" }),
    ]);

    /* ---------------- TOTAL VALUE ---------------- */
    const approvedInventory = await Inventory.find(
      { status: "approved" },
      { price: 1 }
    );

    const totalValue = approvedInventory.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    /* ---------------- RECENT SALES ---------------- */
    const recentSales = await Sold.find()
  .sort({ createdAt: -1 })
  .limit(5)
  .populate({
    path: "inventoryItem",
    populate: { path: "category" },
  });

const safeRecentSales = recentSales.filter(
  (s) => s.inventoryItem !== null
);

const mappedRecentSales = safeRecentSales.map((s) => ({
  id: s._id,
  inventoryItem: s.inventoryItem,
  price: s.price,
  currency: s.currency,
  soldDate: s.soldDate,
}));


    res.json({
      data: {
        totalInventory,
        approvedItems,
        soldItems,
        pendingApproval,
        totalValue,
        recentSales: mappedRecentSales,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      error: "Failed to load dashboard data",
    });
  }
};
