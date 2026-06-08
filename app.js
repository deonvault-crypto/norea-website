const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let products = [];
window.products = products;

const galleryImages = [
  { src: 'assets/images/01-confident-stride-in-serene-surroundings.webp', alt: 'confident stride in serene surroundings' },
  { src: 'assets/images/02-move-beautifully-live-confidently.webp', alt: 'move beautifully live confidently' },
  { src: 'assets/images/07-effortless-style-in-every-move.webp', alt: 'effortless style in every move' },
  { src: 'assets/images/11-athleisure-fashion-lookbook-with-nor-a.webp', alt: 'athleisure fashion lookbook with NORÉA' },
  { src: 'assets/images/12-effortless-elegance-in-activewear.webp', alt: 'effortless elegance in activewear' },
  { src: 'assets/images/15-a-clean-studio-fashion-catalog-composite-image-o.webp', alt: 'clean studio fashion catalog composite' },
  { src: 'assets/images/16-a-clean-commercial-catalog-lookbook-collage-imag.webp', alt: 'clean commercial catalog lookbook collage' }
];

const ORDER_PHONE = '263776678288';
const money = (n) => 'USD ' + Number(n || 0).toFixed(2);
const optionText = (value) => Array.isArray(value) ? value.join(', ') : value;
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const selectId = (productId, type) => `${type}-${productId}`;
const imageId = (productId, context = 'card') => `${context}-image-${productId}`;

let cart = JSON.parse(localStorage.getItem('noreaCart') || '[]');
let currentFilter = 'All';
let isCheckingOut = false;

function normalizeProduct(product) {
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : AVAILABLE_SIZES;
  return {
    id: product.id,
    name: product.name || 'NORÉA Product',
    category: product.category || 'Sets',
    price: Number(product.price || 0),
    sizes,
    tag: product.tag || 'New',
    image: product.image || 'assets/images/02-move-beautifully-live-confidently.webp',
    description: product.description || 'Premium NORÉA activewear piece designed for confidence, movement and everyday elegance.',
    active: product.active !== false
  };
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products?cache=' + Date.now());
    if (!response.ok) throw new Error('Could not load products.');
    const data = await response.json();
    products = Array.isArray(data.products) ? data.products.map(normalizeProduct).filter(p => p.active) : [];
  } catch (error) {
    console.warn('Product load failed:', error);
    products = [];
  }
  window.products = products;
}

function saveCart() {
  localStorage.setItem('noreaCart', JSON.stringify(cart));
  renderCart();
}

function normalizeCart() {
  const normalized = [];
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const size = product.sizes.includes(item.size) ? item.size : product.sizes[0];
    const qty = Number.parseInt(item.qty, 10);
    if (!Number.isInteger(qty) || qty < 1) return;

    const key = `${item.id}|${size}`;
    const existing = normalized.find(row => row.key === key);
    if (existing) existing.qty += qty;
    else normalized.push({ key, id: item.id, qty, size });
  });
  cart = normalized;
  localStorage.setItem('noreaCart', JSON.stringify(cart));
}

function getProductImage(product) {
  return product.image;
}

function getSelection(id, type) {
  const field = document.getElementById(selectId(id, type));
  return field ? field.value : '';
}

function scrollToShop() {
  closeCart();
  closeQuickView();
  document.body.classList.remove('menu-open');
  document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
}

function addToCart(id, size) {
  const product = products.find(p => p.id === id);
  if (!product) return openContact('NORÉA item');

  const selectedSize = size || getSelection(id, 'size') || product.sizes[0];
  const key = `${id}|${selectedSize}`;
  const item = cart.find(i => i.key === key);

  if (item) item.qty += 1;
  else cart.push({ key, id, qty: 1, size: selectedSize });

  saveCart();
  closeQuickView();
  openCart();
}

function removeFromCart(key) {
  cart = cart.filter(i => i.key !== key);
  saveCart();
}

function changeQty(key, diff) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty += diff;
  if (item.qty <= 0) removeFromCart(key);
  saveCart();
}

function renderOptionSelect(product) {
  return `
    <label class="product-option">
      <span>Size</span>
      <select id="${selectId(product.id, 'size')}">
        ${product.sizes.map(value => `<option value="${value}">${value}</option>`).join('')}
      </select>
    </label>
  `;
}

function renderEmptyStore() {
  return `
    <div class="empty-store reveal seen">
      <p class="eyebrow">Coming soon</p>
      <h3>NORÉA products are being added.</h3>
      <p class="muted">The store is now controlled by admin uploads. New activewear pieces will appear here as soon as they are published.</p>
      <a class="btn dark" href="/admin.html">Admin upload</a>
    </div>
  `;
}

function renderProducts() {
  const grid = $('#productGrid');
  const filtered = currentFilter === 'All' ? products : products.filter(p => p.category === currentFilter);
  $('#productCount').textContent = `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'} shown`;

  if (!filtered.length) {
    grid.innerHTML = renderEmptyStore();
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <article class="product-card reveal" data-product-id="${p.id}">
      <div class="product-image-wrap">
        <img id="${imageId(p.id, 'card')}" src="${getProductImage(p)}" alt="${p.name}" loading="lazy" />
        <span class="product-badge">${p.tag}</span>
        <button class="quick-view" onclick="openQuickView('${p.id}')">Quick view</button>
      </div>
      <div class="product-copy">
        <div>
          <p class="eyebrow">${p.category}</p>
          <h3>${p.name}</h3>
        </div>
        <strong>${money(p.price)}</strong>
      </div>
      <p class="muted small">Sizes: ${optionText(p.sizes)}</p>
      <div class="product-options single">
        ${renderOptionSelect(p)}
      </div>
      <button class="btn dark full" onclick="addToCart('${p.id}')">Add to bag</button>
    </article>
  `).join('');
  observeReveal();
}

function renderFilters() {
  const order = ['All', 'Sets', 'Jumpsuit', 'Shorts', 'Tops', 'Jackets', 'Lounge'];
  const available = new Set(products.map(p => p.category));
  const cats = ['All', ...order.filter(cat => cat !== 'All' && available.has(cat)), ...[...available].filter(cat => !order.includes(cat))];
  $('#filters').innerHTML = cats.map(cat => `
    <button class="chip ${cat === currentFilter ? 'active' : ''}" onclick="setFilter('${cat}')">${cat}</button>
  `).join('');
}

function setFilter(cat) {
  currentFilter = cat;
  renderFilters();
  renderProducts();
  document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderGallery() {
  const gallery = $('#galleryGrid');
  gallery.innerHTML = galleryImages.map((g, i) => `
    <figure class="gallery-item reveal ${i % 5 === 0 ? 'wide' : ''}">
      <img src="${g.src}" alt="${g.alt}" loading="lazy" />
    </figure>
  `).join('');
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $$('.cart-count').forEach(el => el.textContent = count);
  const list = $('#cartItems');

  if (!cart.length) {
    list.innerHTML = '<p class="empty">Your bag is empty. Add your favourite NORÉA pieces.</p><button class="btn light full" onclick="scrollToShop()">← Back to shop</button>';
    $('#cartTotal').textContent = money(0);
    return;
  }

  let total = 0;
  list.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    if (!p) return '';
    total += p.price * item.qty;
    return `
      <div class="cart-row">
        <img src="${getProductImage(p)}" alt="${p.name}" />
        <div>
          <strong>${p.name}</strong>
          <p>Size: ${item.size}</p>
          <p>${money(p.price)}</p>
          <div class="qty">
            <button onclick="changeQty('${item.key}', -1)" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${item.key}', 1)" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="icon-only" onclick="removeFromCart('${item.key}')" aria-label="Remove item">×</button>
      </div>`;
  }).join('');
  $('#cartTotal').textContent = money(total);
}

function openCart() { document.body.classList.add('cart-open'); }
function closeCart() { document.body.classList.remove('cart-open'); }

function openQuickView(id) {
  const p = products.find(prod => prod.id === id);
  if (!p) return;

  $('#modalContent').innerHTML = `
    <button class="modal-back" onclick="closeQuickView()" type="button">← Back to shop</button>
    <button class="modal-close" onclick="closeQuickView()" aria-label="Close quick view">×</button>
    <div class="modal-grid">
      <div class="modal-image-wrap"><img id="${imageId(p.id, 'modal')}" src="${getProductImage(p)}" alt="${p.name}" /></div>
      <div class="modal-copy">
        <p class="eyebrow">${p.category} • ${p.tag}</p>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <div class="product-options modal-options single">
          <label class="product-option">
            <span>Size</span>
            <select id="modal-size-${p.id}">${p.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}</select>
          </label>
        </div>
        <p class="muted">Worldwide delivery in 10–15 business days. Secure online checkout in USD.</p>
        <strong class="modal-price">${money(p.price)}</strong>
        <div class="modal-actions">
          <button class="btn dark" onclick="addToCart('${p.id}', document.getElementById('modal-size-${p.id}').value)">Add to bag</button>
          <button class="btn light" onclick="closeQuickView()">Keep browsing</button>
        </div>
      </div>
    </div>`;
  document.body.classList.add('modal-open');
}

function closeQuickView() { document.body.classList.remove('modal-open'); }

function openContact(item = 'NORÉA order') {
  const message = encodeURIComponent(`Hi NORÉA, I need help with: ${item}. Please help me confirm sizing and delivery.`);
  window.location.href = `https://wa.me/${ORDER_PHONE}?text=${message}`;
}

async function checkoutStripe() {
  if (!cart.length || isCheckingOut) return;

  const checkoutBtn = $('#checkoutBtn');
  isCheckingOut = true;
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Opening secure checkout…';

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    });

    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || 'Checkout could not be started.');
    window.location.href = data.url;
  } catch (error) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Secure Checkout';
    isCheckingOut = false;
    alert(`${error.message}\n\nPlease try again or contact NORÉA support.`);
  }
}

function showCheckoutStatus() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout');
  if (!status) return;

  const banner = document.createElement('div');
  banner.className = `checkout-status ${status === 'success' ? 'success' : 'cancelled'}`;

  if (status === 'success') {
    banner.innerHTML = '<strong>Payment received.</strong> Thank you for shopping NORÉA. Your order is being prepared.';
    cart = [];
    localStorage.removeItem('noreaCart');
  } else {
    banner.innerHTML = '<strong>Checkout cancelled.</strong> Your pieces are still in your bag when you are ready.';
  }

  document.body.prepend(banner);
  window.history.replaceState({}, document.title, window.location.pathname);
}

function observeReveal() {
  const els = $$('.reveal:not(.seen)');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('seen'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

async function init() {
  showCheckoutStatus();
  await loadProducts();
  normalizeCart();
  renderFilters();
  renderProducts();
  renderGallery();
  renderCart();
  $('#cartButton').addEventListener('click', openCart);
  $('#cartBack').addEventListener('click', scrollToShop);
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartOverlay').addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', checkoutStripe);
  $('#mobileMenu').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeQuickView(); } });
  observeReveal();
}

document.addEventListener('DOMContentLoaded', init);
