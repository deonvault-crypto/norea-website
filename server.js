const http = require('http');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const PORT = process.env.PORT || 10000;
const ROOT = __dirname;
const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_COLORS = ['Black', 'Pink', 'Yellow', 'Blue', 'Brown', 'Red'];

const PRODUCTS = {
  'contour-black-jumpsuit': { name: 'NORÉA Eclipse Sculpt Jumpsuit', price: 72, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'grey-cutout-set': { name: 'NORÉA Aura Cutout Set', price: 58, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'black-cutout-set': { name: 'NORÉA Onyx Open-Back Set', price: 60, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'khaki-soft-set': { name: 'NORÉA Drift Lounge Set', price: 64, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'purple-energy-set': { name: 'NORÉA Amethyst Flow Set', price: 54, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'pink-short-set': { name: 'NORÉA Blush Sprint Set', price: 46, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'crop-tee-pack': { name: 'NORÉA Signature Crop Tee', price: 32, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'yellow-three-piece': { name: 'NORÉA Solace Three-Piece Set', price: 78, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'contour-jacket-collection': { name: 'NORÉA Tempo Zip Jacket', price: 48, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'pink-brown-duo': { name: 'NORÉA Muse Zip Set', price: 62, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'soft-power-collection': { name: 'NORÉA Soft Power Set', price: 56, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS },
  'details-pack': { name: 'NORÉA Luxe Texture Set', price: 52, sizes: AVAILABLE_SIZES, colors: AVAILABLE_COLORS }
};

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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid checkout request.'));
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

function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your bag is empty.');

  return items.map(item => {
    const product = PRODUCTS[item.id];
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
        unit_amount: product.price * 100,
        product_data: {
          name: `${product.name} — ${size} / ${color}`,
          description: `Size: ${size} • Color: ${color} • Estimated delivery: 10–15 business days`
        }
      }
    };
  });
}

async function handleCheckout(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!process.env.STRIPE_SECRET_KEY) return sendJson(res, 500, { error: 'Stripe is not configured yet.' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await readJsonBody(req);
    const items = body.items || [];
    const lineItems = buildLineItems(items);
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

  if (requestUrl.pathname === '/api/create-checkout-session') {
    return handleCheckout(req, res);
  }

  return serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NORÉA website running on port ${PORT}`);
});
