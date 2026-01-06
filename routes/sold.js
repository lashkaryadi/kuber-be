// import express from 'express';
// import * as soldController from '../controllers/soldController.js';

// const router = express.Router();

// router.get('/', soldController.getAllSold);
// router.get('/:id', soldController.getSoldById);
// router.post('/', soldController.recordSale);

// export default router;

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  res.json([]);
});

export default router;
