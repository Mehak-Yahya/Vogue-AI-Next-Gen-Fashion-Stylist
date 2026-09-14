const sharp = require('sharp');

const MAX_IMAGE_PIXELS = 25_000_000;
const MAX_IMAGE_SIDE = 8192;
const allowedFormats = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff']);

const validateImage = async (buffer) => {
  try {
    const metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    const width = Number(metadata.width || 0);
    const height = Number(metadata.height || 0);

    if (!metadata.format || !allowedFormats.has(metadata.format)) {
      throw new Error('Only JPEG, PNG, WebP, GIF, AVIF, and TIFF images are allowed.');
    }
    if (!width || !height || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE) {
      throw new Error(`Image dimensions must not exceed ${MAX_IMAGE_SIDE}x${MAX_IMAGE_SIDE} pixels.`);
    }
    if (width * height > MAX_IMAGE_PIXELS) {
      throw new Error('Image dimensions are too large to process safely.');
    }

    return metadata;
  } catch (error) {
    if (error.message.includes('Input image exceeds pixel limit')) {
      throw new Error('Image dimensions are too large to process safely.');
    }
    throw new Error(error.message || 'The uploaded file is not a valid image.');
  }
};

module.exports = { validateImage };
