const fs = require('fs');
const path = require('path');

const colorFile = path.join(__dirname, '..', 'data', 'combined_names.txt');
const sourceColorFile = path.join(__dirname, '..', '..', 'combined_names.txt');
let paletteCache = null;
let paletteCacheSignature = '';

const parseColorPalettes = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const palettes = {};

  for (let index = 0; index < lines.length; index += 2) {
    const season = lines[index];
    const colors = (lines[index + 1] || '')
      .split(',')
      .map((color) => color.trim())
      .filter(Boolean);
    palettes[season] = [...new Set([...(palettes[season] || []), ...colors])];
  }

  return palettes;
};

const readColorPalettes = () => {
  const files = [colorFile, sourceColorFile].filter((file, index, all) => fs.existsSync(file) && all.indexOf(file) === index);
  const signature = files.map((file) => `${file}:${fs.statSync(file).mtimeMs}`).join('|');
  if (paletteCache && paletteCacheSignature === signature) return paletteCache;

  paletteCache = files.reduce((palettes, file) => {
    const parsed = parseColorPalettes(fs.readFileSync(file, 'utf8'));
    Object.entries(parsed).forEach(([season, colors]) => {
      palettes[season] = [...new Set([...(palettes[season] || []), ...colors])];
    });
    return palettes;
  }, {});
  paletteCacheSignature = signature;
  return paletteCache;
};

const getRecommendedColors = (season) => {
  const palettes = readColorPalettes();
  if (!season) return palettes;
  const match = Object.keys(palettes).find((name) => name.toLowerCase() === season.toLowerCase());
  return match ? { [match]: palettes[match] } : {};
};

module.exports = { colorFile, getRecommendedColors, readColorPalettes };