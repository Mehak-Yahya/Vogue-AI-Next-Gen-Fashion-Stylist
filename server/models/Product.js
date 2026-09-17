const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true, index: true },
  brand: { type: String, required: true, index: true },
  title: { type: String, default: '' },
  color: { type: String, default: 'Not specified', index: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'PKR' },
  url: { type: String, required: true },
  image: { type: String, default: '' },
  active: { type: Boolean, default: true, index: true },
  lastSeenAt: { type: Date, default: Date.now },
  scraped_at: { type: Date, default: Date.now },
}, { versionKey: false });

productSchema.index({ brand: 1, color: 1 });

module.exports = mongoose.model('Product', productSchema);