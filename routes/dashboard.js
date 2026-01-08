// import express from 'express';
// import { protect } from '../middleware/authMiddleware.js';

// const router = express.Router();

// router.get('/', async (req, res) => {
//   res.json({
//     users: 1,
//     inventory: 0,
//     categories: 0,
//     sold: 0,
//   });
// });

// export default router;

import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDashboardStats);

export default router;

