const http = require('http');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const PORT = process.env.PORT || 10000;
const ROOT = __dirname;
const CATALOG_PATH = 'products.json';
const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_COLORS = ['Black', 'Pink', 'Yellow', 'Blue', 'Brown', 'Red'];
const GITHUB_REPO = process.env.GITHUB_REPO || 'deonvault-crypto/norea-website';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > maxBytes) {
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid request.'));
      }
    });
    req.on('error', reject);
  });
}

function getOrigin(req) {
  const host = req.headers.host;
  return (process.env.SITE_URL || `https://${host}`).replace(/\/$/, '');
}

function getShippingCountries() {
  return (process.env.STRIPE_SHIPPING_COUNTRIES || 'ZW,ZA,GB,US')
    .split(',')
    .map(country => country.trim().toUpperCase())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function safeArray(value, fallback) {
  return Array.isArray(value) && value.length ? value.filter(Boolean) : fallback;
}

function normalizeProduct(product) {
  const id = slugify(product.id || product.name);
  if (!id) throw new Error('Product needs a name.');

  return {
    id,
    name: String(product.name || 'NORÉA Product').trim(),
    category: String(product.category || 'Sets').trim(),
    price: Number(product.price || 0),
    sizes: safeArray(product.sizes, AVAILABLE_SIZES),
    colors: safeArray(product.colors, AVAILABLE_COLORS),
    tag: String(product.tag || 'New').trim(),
    image: String(product.image || 'assets/images/02-move-beautifully-live-confidently.webp').trim(),
    imagesByColor: product.imagesByColor && typeof product.imagesByColor === 'object' ? product.imagesByColor : {},
    description: String(product.description || 'Premium NORÉA activewear piece designed for confidence, movement and everyday elegance.').trim(),
    active: product.active !== false
  };
}

function readLocalProducts() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, CATALOG_PATH), 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  } catch (error) {
    return [];
  }
}

async function getProducts() {
  return readLocalProducts();
}

async function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your bag is empty.');
  const catalog = await getProducts();

  return items.map(item => {
    const product = catalog.find(p => p.id === item.id && p.active !== false);
    if (!product) throw new Error('One item is no longer available.');

    const quantity = Number.parseInt(item.qty, 10);
    const size = String(item.size || '').trim();
    const color = String(item.color || '').trim();

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error('Invalid quantity selected.');
    if (!product.sizes.includes(size)) throw new Error(`Invalid size for ${product.name}.`);
    if (!product.colors.includes(color)) throw new Error(`Invalid color for ${product.name}.`);

    return {
      quantity,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: `${product.name} — ${size} / ${color}`,
          description: `Size: ${size} • Color: ${color} • Estimated delivery: 10–15 business days`
        }
      }
    };
  });
}

async function handleProducts(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed.' });
  const products = await getProducts();
  return sendJson(res, 200, { products });
}

async function handleCheckout(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!process.env.STRIPE_SECRET_KEY) return sendJson(res, 500, { error: 'Stripe is not configured yet.' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await readJsonBody(req);
    const items = body.items || [];
    const lineItems = await buildLineItems(items);
    const orderSummary = items.map(item => `${item.qty}x ${item.id} (${item.size}/${item.color})`).join('; ').slice(0, 500);
    const origin = getOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: getShippingCountries() },
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: { brand: 'NORÉA', delivery_estimate: '10–15 business days', order_summary: orderSummary }
    });

    return sendJson(res, 200, { url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return sendJson(res, 400, { error: error.message || 'Unable to create checkout.' });
  }
}

async function githubRequest(endpoint, options = {}) {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured.');

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  if (response.status === 404) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'GitHub upload failed.');
  return data;
}

function checkAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not configured.');
  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    const error = new Error('Wrong admin password.');
    error.status = 401;
    throw error;
  }
}

async function getGitHubTextFile(filePath) {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const file = await githubRequest(`/contents/${encodedPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`);
  if (!file) return { sha: null, content: null };
  const content = Buffer.from(file.content || '', 'base64').toString('utf8');
  return { sha: file.sha, content };
}

async function putGitHubFile(filePath, contentBase64, message, sha = null) {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const payload = { message, content: contentBase64, branch: GITHUB_BRANCH };
  if (sha) payload.sha = sha;

  return githubRequest(`/contents/${encodedPath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function loadGitHubCatalog() {
  const file = await getGitHubTextFile(CATALOG_PATH);
  if (!file.content) return { products: [], sha: file.sha };
  const parsed = JSON.parse(file.content);
  return { products: Array.isArray(parsed) ? parsed.map(normalizeProduct) : [], sha: file.sha };
}

async function saveGitHubCatalog(products, sha, message) {
  const content = Buffer.from(JSON.stringify(products.map(normalizeProduct), null, 2) + '\n', 'utf8').toString('base64');
  return putGitHubFile(CATALOG_PATH, content, message, sha);
}

async function uploadImageFile(filePath, imageData, message) {
  const match = String(imageData || '').match(/^data:image\/(webp|png|jpeg);base64,(.+)$/);
  if (!match) throw new Error('Image must be a PNG, JPG, or WEBP file.');

  const existing = await getGitHubTextFile(filePath);
  return putGitHubFile(filePath, match[2], message, existing.sha);
}

async function triggerDeploy() {
  if (!process.env.RENDER_DEPLOY_HOOK_URL) return;
  fetch(process.env.RENDER_DEPLOY_HOOK_URL, { method: 'POST' }).catch(error => console.warn('Deploy hook failed:', error));
}

async function handleAdminSaveProduct(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  try {
    checkAdmin(req);
    const body = await readJsonBody(req, 11 * 1024 * 1024);
    const productInput = body.product || {};
    const mainImageData = body.mainImageData;
    const catalog = await loadGitHubCatalog();
    const existing = catalog.products.find(p => p.id === slugify(productInput.id || productInput.name));

    const product = normalizeProduct({
      ...(existing || {}),
      ...productInput,
      id: slugify(productInput.id || productInput.name)
    });

    if (mainImageData) {
      const imagePath = `assets/images/${product.id}-main.webp`;
      await uploadImageFile(imagePath, mainImageData, `Upload main image for ${product.name}`);
      product.image = imagePath;
    }

    const nextProducts = catalog.products.filter(p => p.id !== product.id);
    nextProducts.push(product);
    await saveGitHubCatalog(nextProducts, catalog.sha, `Save product ${product.name}`);
    await triggerDeploy();

    return sendJson(res, 200, { product, message: 'Product saved.' });
  } catch (error) {
    console.error('Admin product save error:', error);
    return sendJson(res, error.status || 400, { error: error.message || 'Unable to save product.' });
  }
}

async function handleAdminDeleteProduct(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  try {
    checkAdmin(req);
    const body = await readJsonBody(req);
    const id = slugify(body.productId);
    if (!id) throw new Error('Choose a product to delete.');

    const catalog = await loadGitHubCatalog();
    const nextProducts = catalog.products.filter(p => p.id !== id);
    await saveGitHubCatalog(nextProducts, catalog.sha, `Delete product ${id}`);
    await triggerDeploy();

    return sendJson(res, 200, { message: 'Product deleted.' });
  } catch (error) {
    console.error('Admin product delete error:', error);
    return sendJson(res, error.status || 400, { error: error.message || 'Unable to delete product.' });
  }
}

async function handleAdminUpload(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  try {
    checkAdmin(req);
    const body = await readJsonBody(req, 9 * 1024 * 1024);
    const productId = slugify(body.productId);
    const color = String(body.color || '').trim();
    const imageData = String(body.imageData || '');

    const catalog = await loadGitHubCatalog();
    const product = catalog.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found. Add the product first.');
    if (!AVAILABLE_COLORS.includes(color)) throw new Error('Invalid color selected.');

    const filePath = `assets/images/${productId}-${slugify(color)}.webp`;
    await uploadImageFile(filePath, imageData, `Upload ${color} image for ${product.name}`);

    product.imagesByColor = product.imagesByColor || {};
    product.imagesByColor[color] = filePath;
    if (!product.colors.includes(color)) product.colors.push(color);

    await saveGitHubCatalog(catalog.products, catalog.sha, `Link ${color} image for ${product.name}`);
    await triggerDeploy();

    return sendJson(res, 200, { path: filePath, product });
  } catch (error) {
    console.error('Admin upload error:', error);
    return sendJson(res, error.status || 400, { error: error.message || 'Unable to upload image.' });
  }
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const safePath = path.normalize(pathname).replace(/^\.{2,}(\/|\\|$)/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');

  if (requestUrl.pathname === '/health') {
    return sendJson(res, 200, { ok: true, service: 'norea-website' });
  }

  if (requestUrl.pathname === '/api/products') {
    return handleProducts(req, res);
  }

  if (requestUrl.pathname === '/api/create-checkout-session') {
    return handleCheckout(req, res);
  }

  if (requestUrl.pathname === '/api/admin/save-product') {
    return handleAdminSaveProduct(req, res);
  }

  if (requestUrl.pathname === '/api/admin/delete-product') {
    return handleAdminDeleteProduct(req, res);
  }

  if (requestUrl.pathname === '/api/admin/upload-color-image') {
    return handleAdminUpload(req, res);
  }

  return serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NORÉA website running on port ${PORT}`);
});
