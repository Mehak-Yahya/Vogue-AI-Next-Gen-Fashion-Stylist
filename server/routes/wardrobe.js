const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const WardrobeItem = require('../models/WardrobeItem');
const { requireAuth } = require('../middleware/requireAuth');
const { validateImage } = require('../utils/validateImage');
const User = require('../models/User');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads', 'wardrobe');
const FREE_WARDROBE_LIMIT = 5;
const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

const imageUrl = (filename) => `/api/wardrobe/image/${encodeURIComponent(filename)}`;
const serializeItem = (item) => {
  const serialized = { ...item };
  delete serialized._id;
  if (serialized.filename && !serialized.filepath.startsWith('http')) {
    serialized.filepath = imageUrl(serialized.filename);
  }
  return serialized;
};
const itemsForUser = (userId) => WardrobeItem.find({ userId }).sort({ upload_date: -1 }).lean();
const uploadToCloudinary = (buffer, userId) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: `vogue-ai/wardrobe/${userId}`, resource_type: 'image' },
    (error, result) => (error ? reject(error) : resolve(result)),
  );
  stream.end(buffer);
});
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

router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('profile').lean();
  return res.json({
    items: (await itemsForUser(req.user.id)).map(serializeItem),
    isPremium: user?.profile?.subscriptionStatus === 'active',
  });
});

router.get('/image/:filename', requireAuth, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const item = await WardrobeItem.findOne({ userId: req.user.id, filename }).lean();

  if (!item) return res.status(404).json({ error: 'Image not found.' });

  return res.sendFile(filename, { root: uploadDirectory });
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload an image file.' });

  const user = await User.findById(req.user.id).select('profile').lean();
  const isPremium = user?.profile?.subscriptionStatus === 'active';
  const itemCount = await WardrobeItem.countDocuments({ userId: req.user.id });
  if (!isPremium && itemCount >= FREE_WARDROBE_LIMIT) {
    return res.status(402).json({
      code: 'WARDROBE_LIMIT_REACHED',
      error: 'Your free wardrobe includes 5 items. Upgrade to add unlimited pieces.',
    });
  }

  try {
    await validateImage(req.file.buffer);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  let filename;
  let filepath;
  let cloudinaryPublicId;
  if (cloudinaryConfigured) {
    try {
      const uploaded = await uploadToCloudinary(req.file.buffer, req.user.id);
      filepath = uploaded.secure_url;
      cloudinaryPublicId = uploaded.public_id;
    } catch (error) {
      console.error('Cloudinary wardrobe upload failed:', error.message);
      return res.status(502).json({ error: 'Image storage is temporarily unavailable.' });
    }
  } else {
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    filename = `${Date.now()}_${safeName}`;
    filepath = imageUrl(filename);
    fs.writeFileSync(path.join(uploadDirectory, filename), req.file.buffer);
  }
  const item = await WardrobeItem.create({
    userId: req.user.id,
    ...(filename ? { filename } : {}),
    ...(cloudinaryPublicId ? { cloudinaryPublicId } : {}),
    filepath,
    category: req.body.category || 'top',
    color: req.body.color || 'unknown',
    season: req.body.season || 'all-season',
    occasion: req.body.occasion || 'casual',
    brand: req.body.brand || '',
    purchase_date: req.body.purchase_date || '',
    price: Number(req.body.price) || 0,
    times_worn: 0,
    last_worn: null,
    upload_date: new Date(),
  });
  res.status(201).json({ success: true, item: serializeItem(item.toObject()) });
});

router.delete('/:itemId', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const item = await WardrobeItem.findOne({ id: req.params.itemId, userId }).lean();
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  if (item.cloudinaryPublicId && cloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(item.cloudinaryPublicId, { resource_type: 'image' });
    } catch (error) {
      console.error('Cloudinary wardrobe deletion failed:', error.message);
      return res.status(502).json({ error: 'Image storage is temporarily unavailable.' });
    }
  }
  await WardrobeItem.deleteOne({ id: req.params.itemId, userId });
  if (item.filename) fs.rmSync(path.join(uploadDirectory, item.filename), { force: true });
  res.json({ success: true });
});

router.post('/:itemId/worn', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const item = await WardrobeItem.findOneAndUpdate(
    { id: req.params.itemId, userId },
    { $inc: { times_worn: 1 }, $set: { last_worn: new Date() } },
    { new: true, lean: true },
  );
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  res.json({ success: true, item: serializeItem(item) });
});

router.get('/stats/summary', requireAuth, async (req, res) => {
  const items = await itemsForUser(req.user.id);
  const categories = {};
  const colors = {};
  items.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + 1;
    colors[item.color] = (colors[item.color] || 0) + 1;
  });
  res.json({
    total_items: items.length,
    total_value: items.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    most_worn: items.reduce((best, item) => (!best || item.times_worn > best.times_worn ? serializeItem(item) : best), null),
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

router.get('/outfits/generate', requireAuth, async (req, res) => {
  const outfits = buildOutfits((await itemsForUser(req.user.id)).map(serializeItem));
  if (!outfits.length) {
    return res.json({
      outfits: [],
      message: 'Add a dress, or add a matching top and bottom, to generate an outfit.',
    });
  }
  res.json({ outfits });
});

module.exports = router;
