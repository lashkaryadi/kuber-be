import express from "express";
import { getProfitAnalytics, getMonthlyProfitAnalytics, getCategoryProfitAnalytics, exportProfitExcel } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profit", protect, getProfitAnalytics);
router.get("/monthly-profit", protect, getMonthlyProfitAnalytics);
router.get("/category-profit", protect, getCategoryProfitAnalytics);
router.get("/profit/export", protect, exportProfitExcel);

export default router;
