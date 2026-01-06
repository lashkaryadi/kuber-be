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

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  const users = await User.countDocuments();

  res.json({
    users,
    inventory: 0,
    sold: 0,
    categories: 0,
  });
});

export default router;
