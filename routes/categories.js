import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  exportCategoriesToExcel,
} from "../controllers/categoryController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCategories);
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);
router.get("/export", protect, exportCategoriesToExcel);

export default router;
