import express from "express";
import upload from "../middleware/upload.js";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), uploadImage);

router.delete("/", protect, deleteImage);

export default router;