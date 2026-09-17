const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { chromium } = require('playwright');
const { readColorPalettes } = require('./recommendationService');

const brands = {
   Ethnc: [
    'https://pk.ethnc.com/collections/women-view-all',
    'https://pk.ethnc.com/collections/women-eastern-view-all',
    'https://pk.ethnc.com/collections/women-western-view-all',
  ],
  Sapphire: [
    'https://pk.sapphireonline.pk/collections/ready-to-wear',
    ' ',
    'https://pk.sapphireonline.pk/collections/man',
  ],
  Limelight: [
    'https://www.limelight.pk/collections/pret',
    'https://www.limelight.pk/collections/menswear',
    'https://www.limelight.pk/collections/ready-to-wear-new-in',
    'https://www.limelight.pk/collections/unstitched-new-in',
  ],
  AsimJofa: [
    'https://asimjofa.com/collections/ready-to-wear',
    'https://asimjofa.com/collections/men-western',
    'https://asimjofa.com/collections/women-western',
    'https://asimjofa.com/collections/unstitched',
  ],
  Generation: [
    'https://generation.com.pk/collections/2-pc-sets',
    'https://generation.com.pk/collections/new-ins',
    'https://generation.com.pk/collections/suits-3-piece',
  ],
  Laam: [
    'https://laam.pk/nodes/women-eastern-ready-to-wear-3',
    'https://laam.pk/men',
    'https://laam.pk/nodes/men-eastern-23',
    'https://laam.pk/nodes/men-western-26',
    'https://laam.pk/nodes/women-eastern-ready-to-wear-3',
    'https://laam.pk/nodes/women-western-9',
    'https://laam.pk/nodes/women-eastern-unstitched-636',
  ],
 
  Alkaram: [
    'https://www.alkaramstudio.com/collections/ready-to-wear',
    'https://www.alkaramstudio.com/collections/new-in-women',
    'https://www.alkaramstudio.com/collections/man',
  ],
  MariaB: ['https://www.mariab.pk/collections/new-arrivals'],
  Sanasafinaz: ['https://sanasafinaz.com/collections/new-arrivals'],
  Nine99: ['https://999.com.pk/collections/new'],
  Khaadi: [
    'https://pk.khaadi.com/new-in/',
    'https://pk.khaadi.com/ready-to-wear/',
  ],
  GulAhmed: [
    'https://www.gulahmedshop.com/collections/women-ideas-pret',
    'https://www.gulahmedshop.com/collections/new-arrivals-men',
    'https://www.gulahmedshop.com/collections/women-ideas-pret',
  ],
  NishatLinen: [
    'https://nishatlinen.com/collections/ready-to-wear-1',
    'https://nishatlinen.com/collections/women',
    'https://nishatlinen.com/collections/men',
  ],
  Beechtree: [
    'https://beechtree.pk/collections/new-arrivals',
  ],
  Outfitters: [
    'https://outfitters.com.pk/collections/men-new-arrivals-view-all',
    'https://outfitters.com.pk/collections/women-new-arrivals-view-all',
  ],
  Zellbury: [
    'https://zellbury.com/collections/shalwar-kameez',
    'https://zellbury.com/collections/essential-summer-pret',
    'https://zellbury.com/collections/women-west',
    'https://zellbury.com/collections/men-basic-t-shirt',
  ],
  BonanzaSatrangi: [
    'https://bonanzasatrangi.com/collections/ready-to-wear',
    'https://bonanzasatrangi.com/collections/new-arrival',
    'https://bonanzasatrangi.com/collections/new-in-men',
  ],
  Saya: [
    'https://saya.pk/collections/new-arrivals-424214954216',
    'https://saya.pk/collections/shop-by-piece-ready-to-wear-424275640552',
    'https://saya.pk/collections/mens-wear-stitched-unstitched-kurta-pyjama-kameez-shalwar-collection-162834677834',
  ],
  Edenrobe: [
    'https://edenrobe.com/collections/women',
    'https://edenrobe.com/collections/men',
  ],
  Diners: [
    'https://diners.com.pk/collections/diners-mens',
    'https://diners.com.pk/collections/ready-to-wear',
  ],
};

const outputFile = path.join(__dirname, '..', 'data', 'skin_tone_products.json');
let productsCache = null;
let productsCacheModifiedAt = 0;
let activeScrape = null;
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const absoluteUrl = (value, pageUrl) => {
  if (!value) return '';
  try { return new URL(value, pageUrl).href; } catch { return ''; }
};

const firstText = ($card, selectors) => {
  for (const selector of selectors) {
    const text = $card.find(selector).first().text().replace(/\s+/g, ' ').trim();
    if (text) return text;
  }
  return '';
};

const firstAttribute = ($card, selectors, attribute) => {
  for (const selector of selectors) {
    const value = $card.find(selector).first().attr(attribute);
    if (value) return value;
  }
  return '';
};

const cardSwatchColor = ($card) => {
  const swatch = $card.find('.product-swatches__item').first();
  return swatch.attr('aria-label') || swatch.attr('data-card-color') || '';
};

const inferColor = (title, palettes, excludedColor = '') => {
  const normalizedTitle = title.toLowerCase();
  for (const color of Object.values(palettes).flat()) {
    if (color.toLowerCase() === excludedColor.toLowerCase()) continue;
    if (normalizedTitle.includes(color.toLowerCase())) return color;
  }
  return '';
};

const cleanColor = (value) => String(value || '')
  .split(/\s+(?:fabric|fit\s*&?\s*sizing|model(?:\s+is)?|cut|style|length|fit)\s*:?/i)[0]
  .trim();

const isUsableColor = (value) => {
  const color = cleanColor(value);
  return Boolean(color)
    && color.length <= 80
    && !/[{};]/.test(color)
    && !/\b(?:@media|background-color|border-radius|product-recommendations|details\s*-\s*description)\b/i.test(color);
};

const colorFromSku = (sku) => {
  const match = String(sku || '').trim().match(/^[^-]+-(.+)-[^-]+$/);
  return match ? match[1].replace(/[-_]+/g, ' ').trim() : '';
};

const cleanMariaBColor = (value) => String(value || '')
  .replace(/^[A-Z]{1,3}\d{2}\s+\d+(?:R\d+)?\s+/i, '')
  .replace(/\s+\d+$/i, '')
  .trim();

const colorFromStructuredData = ($) => {
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data = JSON.parse($(script).text());
      const entries = Array.isArray(data) ? data : [data, ...(data?.['@graph'] || [])];
      const color = entries.find((entry) => entry?.color)?.color;
      if (typeof color === 'string' && color.trim()) return color.trim();
    } catch {
      // Some pages include non-JSON scripts with this MIME type.
    }
  }
  return '';
};

const colorFromText = (text) => {
  const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
  const match = normalizedText.match(/\b(?:color(?:\s+type)?|colour(?:\s+type)?)\s*:\s*(.+?)(?=\s*(?:fabric|material|size|fit|trouser|shirt|item|coat|cut|style|model)\s*:|\s+fit\s*&?\s*sizing\b|\s+fit\b|\s+model\b|\s+length\b|\s*model\s+is\b|\s*the\s+model\b|\s*sku\s*:|$)/i);
  return match?.[1]?.trim() || '';
};

const colorFromNishatText = (text) => {
  const normalizedText = String(text || '').replace(/\s+/g, ' ').trim();
  const colors = [...normalizedText.matchAll(/\bcolor\s*:\s*([A-Za-z][A-Za-z -]*?)(?=\s+(?:fabric|color|note)\s*:|\s*$)/gi)]
    .map((match) => match[1].trim())
    .filter(isUsableColor);
  return [...new Set(colors)].join(' / ');
};

const colorFromDetailTable = ($) => {
  for (const row of $('tr').toArray()) {
    const cells = $(row).find('td').toArray();
    if (cells.length < 2 || !/^(?:color|colour)(?:\s+type)?$/i.test($(cells[0]).text().trim())) continue;
    const color = $(cells[1]).text().replace(/\s+/g, ' ').trim();
    if (isUsableColor(color)) return color;
  }
  return '';
};

const colorFromOption = ($) => {
  const colorOptions = $('input[name="Color"], input[name="color"], input[name*="Color" i], select[name="Color"], select[name="color"], select[name*="Color" i]');
  const colorInput = colorOptions.filter((_, element) => {
    if (!$(element).is(':checked') && $(element).is('input')) return false;
    const value = $(element).attr('value') || $(element).find('option:selected').attr('value');
    return isUsableColor(value);
  }).first();
  if (!colorInput.length) return '';
  const color = colorInput.attr('value') || colorInput.find('option:selected').attr('value');
  return isUsableColor(color) ? cleanColor(color) : '';
};

const colorFromPage = ($) => {
  const candidates = $('body *:not(style):not(script):not(noscript)').toArray()
    .map((element) => $(element).text().replace(/\s+/g, ' ').trim())
    .filter((text) => /\b(?:color|colour)(?:\s+type)?\s*:/i.test(text))
    .sort((left, right) => left.length - right.length);
  return candidates.map(colorFromText).find(isUsableColor) || '';
};

const colorFromRenderedPage = async (page, brand = '') => {
  const rendered = await page.locator('body').evaluate((body) => {
    const colorInput = body.querySelector('input[name="Color"]:checked, input[name="color"]:checked, input[name*="Color" i]:checked');
    const color = colorInput?.getAttribute('value')?.trim() || '';
    body.querySelectorAll('style, script, noscript').forEach((element) => element.remove());
    return { color, text: body.innerText };
  }).catch(() => ({ color: '', text: '' }));
  if (isUsableColor(rendered.color)) return cleanColor(rendered.color);
  const text = rendered.text;
  if (brand === 'NishatLinen') {
    const nishatColor = colorFromNishatText(text);
    if (isUsableColor(nishatColor)) return nishatColor;
  }
  const color = colorFromText(text);
  return isUsableColor(color) ? color : '';
};

const fetchHtml = async (url) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data: html } = await axios.get(url, { headers, timeout: 20000 });
      return html;
    } catch (error) {
      if (error.response?.status !== 429 || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }
  return '';
};

const fetchProductColor = async (productUrl, brand = '') => {
  if (!productUrl) return '';
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const renderedColor = await colorFromRenderedPage(page, brand);
    if (renderedColor) return renderedColor;
  } catch {
    // Fall back to the HTTP response when the browser cannot load the page.
  } finally {
    await page?.close();
  }
  try {
    const html = await fetchHtml(productUrl);
    const $ = cheerio.load(html);
    if (brand === 'NishatLinen') {
      const nishatColor = colorFromNishatText($('.product-tabs .tab-panel').first().text());
      if (isUsableColor(nishatColor)) return nishatColor;
    }
    const detailTableColor = colorFromDetailTable($);
    if (detailTableColor) return detailTableColor;
    const optionColor = colorFromOption($);
    if (optionColor) return optionColor;
    const pageColor = colorFromPage($);
    if (isUsableColor(pageColor)) return pageColor;
    const skuColor = colorFromSku($('.product__sku').first().text());
    if (skuColor) return brand === 'MariaB' ? cleanMariaBColor(skuColor) : skuColor;
    const detailBlocks = $('rte-formatter p, .detail-tabs-content p, .description-and-detail p, .product__description li').toArray();
    for (const paragraph of detailBlocks) {
      const color = colorFromText($(paragraph).text());
      if (isUsableColor(color)) return color;
    }
    const detailText = $('.description-and-detail').text().replace(/\s+/g, ' ').trim();
    const fallbackColor = colorFromText(detailText);
    if (isUsableColor(fallbackColor)) return fallbackColor;
    const structuredColor = colorFromStructuredData($);
    if (isUsableColor(structuredColor)) return structuredColor;
    return '';
  } catch {
    return '';
  }
};

let browserPromise;

const getBrowser = () => {
  browserPromise ||= chromium.launch({ headless: true });
  return browserPromise;
};

const closeBrowser = async () => {
  const browser = await browserPromise?.catch(() => null);
  browserPromise = undefined;
  await browser?.close();
};

const parsePrice = (value) => {
  const match = value.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const scrapeBrand = async (brand, url, palettes) => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const products = [];
  const cards = brand === 'Sapphire'
    ? $('.product-card')
    : $('.card-product, .product-grid-item, .grid__item, .product-item, .product-tile-element, .card, .ProductItem, .t4s-product, .hdt-card-product, [data-testid="product-card"], li.product');
  const laamProductLinks = brand === 'Laam'
    ? $('a[href*="/products/"]').map((_, element) => $(element).attr('href')).get()
    : [];

  cards.each((index, element) => {
    const card = $(element);
    const title = brand === 'Sapphire'
      ? (card.find('.tile-image').first().attr('alt') || firstText(card, ['.pdp-link a', '.product-title']))
      : firstText(card, ['.card__heading a', '.product-title', '.ProductItem__Title', '.grid-product__title', '.hdt-card-product__title', 'rte-formatter', '[class*="title"]']);
    const productTitle = title
      || card.find('img').first().attr('alt')
      || '';
    const href = firstAttribute(card, brand === 'Sapphire'
      ? ['.product-card__media', 'a[href*="/products/"]']
      : ['.card__heading a', '.product-title', '.ProductItem__Title a', 'a[href*="/products/"]'], 'href')
      || laamProductLinks[index];
    const imageSelectors = brand === 'Sapphire' ? ['.tile-image', 'img'] : ['img'];
    const image = firstAttribute(card, imageSelectors, 'data-src')
      || firstAttribute(card, imageSelectors, 'src');
    const priceText = firstText(card, ['.price', '.money', '.hdt-money', '.display-price', '[class*="price"]']);
    if (!href) return;
    const swatchColor = cleanColor(cardSwatchColor(card));
    products.push({
      id: `${brand}-${index}-${absoluteUrl(href, url)}`,
      brand,
      title: productTitle.trim(),
      color: inferColor(`${productTitle} ${image} ${card.text()}`, palettes, brand)
        || (swatchColor.toLowerCase() === brand.toLowerCase() ? '' : swatchColor),
      price: parsePrice(priceText),
      currency: 'PKR',
      url: absoluteUrl(href, url),
      image: absoluteUrl(image, url),
      scraped_at: new Date().toISOString(),
    });
  });

  for (const product of products) {
    const detailColor = await fetchProductColor(product.url, brand);
    product.color = isUsableColor(detailColor) ? cleanColor(detailColor)
      : (isUsableColor(product.color) ? cleanColor(product.color) : 'Not specified');
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return products;
};

const deduplicateProducts = (products) => {
  const seen = new Set();
  return products.filter((product) => {
    const brand = String(product.brand || '').trim().toLowerCase();
    let productPath = '';
    try {
      productPath = product.url ? new URL(product.url).pathname.toLowerCase() : '';
    } catch {
      productPath = '';
    }
    const image = String(product.image || '').split('?')[0].toLowerCase();
    const key = productPath ? `${brand}|${productPath}` : image || product.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const saveProducts = (products) => {
  const uniqueProducts = deduplicateProducts(products);
  const tempFile = `${outputFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(uniqueProducts, null, 2));
  fs.copyFileSync(tempFile, outputFile);
  fs.rmSync(tempFile, { force: true });
  return uniqueProducts;
};

const scrapeBrands = async (requestedBrand) => {
  if (activeScrape) return activeScrape;

  activeScrape = scrapeBrandsInternal(requestedBrand);
  try {
    return await activeScrape;
  } finally {
    activeScrape = null;
  }
};

const scrapeBrandsInternal = async (requestedBrand) => {
  const palettes = readColorPalettes();
  const selected = requestedBrand ? { [requestedBrand]: brands[requestedBrand] } : brands;
  if (requestedBrand && !brands[requestedBrand]) throw new Error(`Unknown brand: ${requestedBrand}`);

  const existingProducts = readProducts();
  const products = [];
  const completedBrands = [];
  for (const [brand, urls] of Object.entries(selected)) {
    let completed = true;
    for (const url of urls) {
      try {
        products.push(...await scrapeBrand(brand, url, palettes));
        const checkpoint = saveProducts([...products, ...existingProducts]);
        console.log(`${brand}: scraped ${checkpoint.length} products so far`);
      } catch (error) {
        completed = false;
        console.warn(`${brand}: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    if (completed) completedBrands.push(brand);
  }
  if (!products.length) throw new Error('No products were scraped; existing data was preserved.');
  const uniqueProducts = saveProducts([...products, ...existingProducts]);
  uniqueProducts.freshProducts = products;
  uniqueProducts.completedBrands = completedBrands;
  return uniqueProducts;
};

const readProducts = () => {
  if (!fs.existsSync(outputFile)) return [];
  const modifiedAt = fs.statSync(outputFile).mtimeMs;
  if (productsCache && productsCacheModifiedAt === modifiedAt) return productsCache;

  productsCache = deduplicateProducts(JSON.parse(fs.readFileSync(outputFile, 'utf8')));
  productsCacheModifiedAt = modifiedAt;
  return productsCache;
};

if (require.main === module) {
  scrapeBrands(process.argv[2]).then((products) => {
    console.log(`Saved ${products.length} products to ${outputFile}`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  }).finally(closeBrowser);
}

module.exports = { brands, outputFile, readProducts, scrapeBrands };