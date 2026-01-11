import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/image", protect, upload.single("file"), (req, res) => {
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
  });
});

export default router;
