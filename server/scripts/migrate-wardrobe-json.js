require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const WardrobeItem = require('../models/WardrobeItem');

const dataFile = path.join(__dirname, '..', 'data', 'wardrobe.json');

const migrate = async () => {
  if (!fs.existsSync(dataFile)) {
    console.log('No wardrobe.json found. Nothing to migrate.');
    return;
  }

  const items = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  let migrated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.userId) {
      skipped += 1;
      continue;
    }

    await WardrobeItem.updateOne(
      { id: String(item.id) },
      {
        $setOnInsert: {
          id: String(item.id),
          userId: item.userId,
          filename: item.filename,
          cloudinaryPublicId: item.cloudinaryPublicId,
          filepath: item.filepath || '',
          category: item.category,
          color: item.color,
          season: item.season,
          occasion: item.occasion,
          brand: item.brand,
          purchase_date: item.purchase_date,
          price: Number(item.price) || 0,
          times_worn: Number(item.times_worn) || 0,
          last_worn: item.last_worn || null,
          upload_date: item.upload_date || new Date(),
        },
      },
      { upsert: true },
    );
    migrated += 1;
  }

  console.log(`Migrated ${migrated} wardrobe item(s); skipped ${skipped} without a userId.`);
};

mongoose.connect(process.env.MONGODB_URI)
  .then(migrate)
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error('Wardrobe migration failed:', error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  });