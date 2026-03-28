import express from 'express';
import { getSeries, createSeries, updateSeries, deleteSeries } from '../controllers/seriesController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();

router.get('/', protect, getSeries);
router.post('/', protect, requireRole(['admin', 'staff']), createSeries);
router.put('/:id', protect, requireRole(['admin']), updateSeries);
router.delete('/:id', protect, requireRole(['admin']), deleteSeries);

export default router;
