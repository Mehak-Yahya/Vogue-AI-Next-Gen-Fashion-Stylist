const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { getRecommendedColors } = require('../services/recommendationService');
const { readProducts, scrapeBrands } = require('../services/scrapeSkinToneBrands');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();
const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 2,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Catalog refresh is limited to two requests per hour.' },
});

router.get('/colors', (req, res) => {
  const palettes = getRecommendedColors(req.query.season);
  if (req.query.season && !Object.keys(palettes).length) {
    return res.status(404).json({ success: false, error: 'Season palette not found.' });
  }
  return res.json({ success: true, palettes });
});

router.get('/products', (req, res) => {
  const products = readProducts();
  const season = req.query.season?.toLowerCase();
  const palettes = season ? Object.values(getRecommendedColors(req.query.season)).flat() : [];
  const colors = palettes.map((color) => color.toLowerCase());
  const filtered = season
    ? products.filter((product) => colors.includes(String(product.color || '').toLowerCase()))
    : products;
  return res.json({ success: true, products: filtered });
});

router.post('/scrape', requireAuth, scrapeLimiter, async (req, res) => {
  try {
    const products = await scrapeBrands(req.body?.brand);
    return res.json({ success: true, count: products.length });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;