const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

const fallbackFile = path.join(__dirname, '..', 'data', 'skin_tone_products.json');
const sourceIdFor = (product) => `${product.brand || 'Unknown'}|${product.url}`;

const readFallbackProducts = () => {
  if (!fs.existsSync(fallbackFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
  } catch (error) {
    console.error('Product fallback data could not be read:', error.message);
    return [];
  }
};

const serializeProduct = (product) => ({
  id: product.sourceId || product.id,
  brand: product.brand,
  title: product.title,
  color: product.color,
  price: product.price,
  currency: product.currency,
  url: product.url,
  image: product.image,
  scraped_at: product.scraped_at,
});

const readCatalogProducts = async () => {
  try {
    const products = await Product.find({ active: { $ne: false } }).sort({ scraped_at: -1 }).lean();
    return products.length ? products.map(serializeProduct) : readFallbackProducts();
  } catch (error) {
    console.warn('MongoDB catalog unavailable; using JSON fallback:', error.message);
    return readFallbackProducts();
  }
};

const persistCatalogProducts = async (products) => {
  const freshProducts = products.freshProducts || products;
  const completedBrands = products.completedBrands || [];
  if (!freshProducts.length) return 0;
  const seenAt = new Date();
  const operations = freshProducts
    .filter((product) => product.id && product.url)
    .map((product) => ({
      updateOne: {
        filter: { sourceId: sourceIdFor(product) },
        update: {
          $set: {
            sourceId: sourceIdFor(product),
            brand: product.brand || 'Unknown',
            title: product.title || '',
            color: product.color || 'Not specified',
            price: Number(product.price) || 0,
            currency: product.currency || 'PKR',
            url: product.url,
            image: product.image || '',
            active: true,
            lastSeenAt: seenAt,
            scraped_at: product.scraped_at ? new Date(product.scraped_at) : new Date(),
          },
        },
        upsert: true,
      },
    }));
  if (!operations.length) return 0;
  await Product.bulkWrite(operations, { ordered: false });
  const freshIds = operations.map(({ updateOne }) => updateOne.update.$set.sourceId);
  await Promise.all(completedBrands.map((brand) => Product.updateMany(
    { brand, sourceId: { $nin: freshIds } },
    { $set: { active: false } },
  )));
  return operations.length;
};

const seedCatalogIfEmpty = async () => {
  const count = await Product.countDocuments();
  if (count > 0) return count;
  const products = readFallbackProducts();
  return persistCatalogProducts(products);
};

module.exports = {
  persistCatalogProducts,
  readCatalogProducts,
  seedCatalogIfEmpty,
};