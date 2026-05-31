const Stripe = require('stripe');

const PRODUCTS = {
  'contour-black-jumpsuit': { name: 'NORÉA Eclipse Sculpt Jumpsuit', price: 72, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'Chocolate', 'Stone'] },
  'grey-cutout-set': { name: 'NORÉA Aura Cutout Set', price: 58, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Grey', 'Black', 'Stone'] },
  'black-cutout-set': { name: 'NORÉA Onyx Open-Back Set', price: 60, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'Mocha', 'Cream'] },
  'khaki-soft-set': { name: 'NORÉA Drift Lounge Set', price: 64, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Khaki', 'Stone', 'Chocolate'] },
  'purple-energy-set': { name: 'NORÉA Amethyst Flow Set', price: 54, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Amethyst', 'Blush', 'Black'] },
  'pink-short-set': { name: 'NORÉA Blush Sprint Set', price: 46, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Blush Pink', 'Chocolate', 'Black'] },
  'crop-tee-pack': { name: 'NORÉA Signature Crop Tee', price: 32, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['White', 'Black', 'Blush Pink'] },
  'yellow-three-piece': { name: 'NORÉA Solace Three-Piece Set', price: 78, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Butter Yellow', 'Stone', 'Black'] },
  'contour-jacket-collection': { name: 'NORÉA Tempo Zip Jacket', price: 48, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Black', 'Blush Pink', 'Stone'] },
  'pink-brown-duo': { name: 'NORÉA Muse Zip Set', price: 62, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Blush Pink', 'Chocolate Brown'] },
  'soft-power-collection': { name: 'NORÉA Soft Power Set', price: 56, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Cream', 'Mocha', 'Black'] },
  'details-pack': { name: 'NORÉA Luxe Texture Set', price: 52, sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Ribbed Blush', 'Charcoal', 'Chocolate'] }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe is not configured yet.' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = (process.env.SITE_URL || req.headers.origin || `https://${req.headers.host}`).replace(/\/$/, '');
    const items = req.body && Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw new Error('Your bag is empty.');

    const line_items = items.map(item => {
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
            description: `Size: ${size} • Color: ${color}`
          }
        }
      };
    });

    const countries = (process.env.STRIPE_SHIPPING_COUNTRIES || 'ZW,ZA,GB,US').split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    const order_summary = items.map(item => `${item.qty}x ${item.id} (${item.size}/${item.color})`).join('; ').slice(0, 500);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: countries },
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: { brand: 'NORÉA', order_summary }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(400).json({ error: error.message || 'Unable to create checkout.' });
  }
};
