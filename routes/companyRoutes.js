import express from "express";
import { getCompany, saveCompany } from "../controllers/companyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCompany);
router.post("/", protect, saveCompany);

export default router;