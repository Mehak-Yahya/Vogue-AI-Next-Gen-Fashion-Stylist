const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const wardrobeItemSchema = new mongoose.Schema({
  id: { type: String, default: randomUUID, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  filename: { type: String },
  cloudinaryPublicId: { type: String },
  filepath: { type: String, required: true },
  category: { type: String, default: 'top' },
  color: { type: String, default: 'unknown' },
  season: { type: String, default: 'all-season' },
  occasion: { type: String, default: 'casual' },
  brand: { type: String, default: '' },
  purchase_date: { type: String, default: '' },
  price: { type: Number, default: 0 },
  times_worn: { type: Number, default: 0 },
  last_worn: { type: Date, default: null },
  upload_date: { type: Date, default: Date.now },
}, { versionKey: false });

wardrobeItemSchema.index({ userId: 1, upload_date: -1 });

module.exports = mongoose.model('WardrobeItem', wardrobeItemSchema);