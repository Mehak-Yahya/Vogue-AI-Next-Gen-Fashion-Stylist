const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { scrapeBrands } = require('../services/scrapeSkinToneBrands');
const { persistCatalogProducts } = require('../services/productCatalogService');

const refreshCatalog = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI must be configured for catalog refreshes.');

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30_000 });
  try {
    const products = await scrapeBrands(process.argv[2]);
    const persisted = await persistCatalogProducts(products);
    console.log(`Catalog refresh complete: ${persisted} products persisted.`);
  } finally {
    await mongoose.disconnect();
  }
};

refreshCatalog().catch((error) => {
  console.error(`Catalog refresh failed: ${error.message}`);
  process.exitCode = 1;
});