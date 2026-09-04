const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const dataDirectory = path.join(__dirname, '..', 'data');
const uploadDirectory = path.join(__dirname, '..', 'uploads', 'wardrobe');
const dataFile = path.join(dataDirectory, 'wardrobe.json');

fs.mkdirSync(dataDirectory, { recursive: true });
fs.mkdirSync(uploadDirectory, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

const readItems = () => JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const writeItems = (items) => fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
const imageUrl = (filename) => `/uploads/wardrobe/${filename}`;
const categoryGroups = {
  tops: ['top', 'shirt', 'blouse', 'sweater', 't-shirt', 'tank'],
  bottoms: ['bottom', 'pants', 'jeans', 'skirt', 'shorts'],
  dresses: ['dress'],
  shoes: ['shoe', 'shoes', 'footwear'],
  extras: ['jacket', 'coat', 'blazer', 'accessory', 'bag', 'jewelry', 'hat'],
};
const inGroup = (item, group) => categoryGroups[group].includes(String(item.category).toLowerCase());
const colorMatches = (first, second) => {
  const a = String(first || '').toLowerCase();
  const b = String(second || '').toLowerCase();
  const neutrals = ['black', 'white', 'gray', 'grey', 'beige', 'navy', 'brown'];
  if (neutrals.includes(a) || neutrals.includes(b) || a === b) return true;
  const pairs = { blue: ['red', 'orange', 'yellow'], red: ['blue', 'green'], green: ['pink', 'purple'], pink: ['green', 'blue'], purple: ['green', 'yellow'] };
  return pairs[a]?.includes(b) || pairs[b]?.includes(a);
};

router.get('/', (req, res) => res.json({ items: readItems() }));

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload an image file.' });
  const item = {
    id: String(Date.now()),
    filename: req.file.filename,
    filepath: imageUrl(req.file.filename),
    category: req.body.category || 'top',
    color: req.body.color || 'unknown',
    season: req.body.season || 'all-season',
    occasion: req.body.occasion || 'casual',
    brand: req.body.brand || '',
    purchase_date: req.body.purchase_date || '',
    price: Number(req.body.price) || 0,
    times_worn: 0,
    last_worn: null,
    upload_date: new Date().toISOString(),
  };
  const items = readItems();
  items.push(item);
  writeItems(items);
  res.status(201).json({ success: true, item });
});

router.delete('/:itemId', (req, res) => {
  const items = readItems();
  const item = items.find((entry) => entry.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  writeItems(items.filter((entry) => entry.id !== req.params.itemId));
  if (item.filename) fs.rmSync(path.join(uploadDirectory, item.filename), { force: true });
  res.json({ success: true });
});

router.post('/:itemId/worn', (req, res) => {
  const items = readItems();
  const item = items.find((entry) => entry.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  item.times_worn = (item.times_worn || 0) + 1;
  item.last_worn = new Date().toISOString();
  writeItems(items);
  res.json({ success: true, item });
});

router.get('/stats/summary', (req, res) => {
  const items = readItems();
  const categories = {};
  const colors = {};
  items.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + 1;
    colors[item.color] = (colors[item.color] || 0) + 1;
  });
  res.json({
    total_items: items.length,
    total_value: items.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    most_worn: items.reduce((best, item) => (!best || item.times_worn > best.times_worn ? item : best), null),
    category_breakdown: categories,
    color_breakdown: colors,
  });
});

const buildOutfits = (items, limit = 15) => {
  const tops = items.filter((item) => inGroup(item, 'tops'));
  const bottoms = items.filter((item) => inGroup(item, 'bottoms'));
  const dresses = items.filter((item) => inGroup(item, 'dresses'));
  const shoes = items.filter((item) => inGroup(item, 'shoes'));
  const outfits = [];
  dresses.forEach((dress) => {
    const shoe = shoes[outfits.length % shoes.length];
    outfits.push({ id: `outfit_${outfits.length}`, type: 'dress', items: [dress, ...(shoe ? [shoe] : [])] });
  });
  tops.forEach((top) => bottoms.forEach((bottom) => {
    if (outfits.length < limit && colorMatches(top.color, bottom.color)) {
      const shoe = shoes[outfits.length % shoes.length];
      outfits.push({ id: `outfit_${outfits.length}`, type: 'separates', items: [top, bottom, ...(shoe ? [shoe] : [])] });
    }
  }));
  return outfits.slice(0, limit);
};

router.get('/outfits/generate', (req, res) => {
  const outfits = buildOutfits(readItems());
  if (!outfits.length) {
    return res.json({
      outfits: [],
      message: 'Add a dress, or add a matching top and bottom, to generate an outfit.',
    });
  }
  res.json({ outfits });
});

module.exports = router;
