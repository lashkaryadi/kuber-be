import Series from '../models/Series.js';

// GET ALL SERIES
export const getSeries = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const query = {
      ownerId: req.user.ownerId,
      isDeleted: false
    };

    if (search && typeof search === 'string' && search.length <= 50) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (pageNum - 1) * limitNum;

    const [series, total] = await Promise.all([
      Series.find(query).sort({ name: 1 }).skip(skip).limit(limitNum),
      Series.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: series,
      meta: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get series error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch series' });
  }
};

// CREATE SERIES
export const createSeries = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Series name is required' });
    }

    const cleanName = name.trim();

    const exists = await Series.findOne({
      ownerId: req.user.ownerId,
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isDeleted: false
    });

    if (exists) {
      return res.status(409).json({ success: false, message: 'Series already exists' });
    }

    const series = await Series.create({
      name: cleanName,
      ownerId: req.user.ownerId
    });

    res.status(201).json({ success: true, data: series });
  } catch (error) {
    console.error('Create series error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Series already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create series' });
  }
};

// UPDATE SERIES
export const updateSeries = async (req, res) => {
  try {
    const { name } = req.body;
    const series = await Series.findOne({
      _id: req.params.id,
      ownerId: req.user.ownerId,
      isDeleted: false
    });

    if (!series) {
      return res.status(404).json({ success: false, message: 'Series not found' });
    }

    if (name?.trim()) {
      series.name = name.trim();
    }

    await series.save();
    res.json({ success: true, data: series });
  } catch (error) {
    console.error('Update series error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Series name already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to update series' });
  }
};

// DELETE SERIES (soft delete)
export const deleteSeries = async (req, res) => {
  try {
    const series = await Series.findOne({
      _id: req.params.id,
      ownerId: req.user.ownerId,
      isDeleted: false
    });

    if (!series) {
      return res.status(404).json({ success: false, message: 'Series not found' });
    }

    series.isDeleted = true;
    series.deletedAt = new Date();
    series.deletedBy = req.user._id;
    await series.save();

    res.json({ success: true, message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Delete series error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete series' });
  }
};
