import mongoose from 'mongoose';

const seriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Series name too long']
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  deletedAt: {
    type: Date
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Unique series name per owner (only non-deleted)
seriesSchema.index({ ownerId: 1, name: 1 }, {
  unique: true,
  partialFilterExpression: { isDeleted: false }
});

seriesSchema.index({ ownerId: 1, isDeleted: 1 });

seriesSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Series', seriesSchema);
