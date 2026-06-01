const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const AVAILABLE_COLORS = [
  { name: 'Black', hex: '#111111', emoji: '⚫️' },
  { name: 'Pink', hex: '#f4aac7', emoji: '🌸' },
  { name: 'Yellow', hex: '#f6d75f', emoji: '🟡' },
  { name: 'Blue', hex: '#4f8edb', emoji: '🔵' },
  { name: 'Brown', hex: '#5b3d32', emoji: '🟤' },
  { name: 'Red', hex: '#c73737', emoji: '🔴' }
];
const COLOR_NAMES = AVAILABLE_COLORS.map(color => color.name);

const products = [
  {
    id: 'pink-brown-duo',
    name: 'NORÉA Muse Zip Set',
    category: 'Sets',
    price: 62,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Elevated',
    image: 'assets/images/09-minimalist-fashion-with-sleek-design.webp',
    description: 'A sleek zip activewear set designed for an elevated fit, smooth support and all-day versatility.'
  },
  {
    id: 'pink-short-set',
    name: 'NORÉA Blush Sprint Set',
    category: 'Shorts',
    price: 46,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Popular',
    image: 'assets/images/13-confident-elegance-in-activewear-styling.webp',
    description: 'A light short set for warm training days, styled with a fitted top and easy movement through every rep.'
  },
  {
    id: 'contour-black-jumpsuit',
    name: 'NORÉA Eclipse Sculpt Jumpsuit',
    category: 'Jumpsuit',
    price: 72,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Signature',
    image: 'assets/images/03-confident-style-in-minimalist-fashion-shot.webp',
    description: 'A premium sculpted jumpsuit with a sleek zip front, supportive stretch and polished NORÉA contour detailing.'
  },
  {
    id: 'grey-cutout-set',
    name: 'NORÉA Aura Cutout Set',
    category: 'Sets',
    price: 58,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Best Seller',
    image: 'assets/images/04-elevated-athleisure-for-every-movement.webp',
    description: 'A refined cutout active set with a long-sleeve layer, high-waist leggings and smooth all-day comfort.'
  },
  {
    id: 'black-cutout-set',
    name: 'NORÉA Onyx Open-Back Set',
    category: 'Sets',
    price: 60,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Sculpt Fit',
    image: 'assets/images/05-athleisure-elegance-with-confident-style.webp',
    description: 'A sculpted open-back training set made for confident movement, clean lines and a premium studio look.'
  },
  {
    id: 'khaki-soft-set',
    name: 'NORÉA Drift Lounge Set',
    category: 'Lounge',
    price: 64,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Soft Touch',
    image: 'assets/images/06-modern-athletic-fashion-advert-with-model.webp',
    description: 'A soft lounge set with a cropped jacket feel, relaxed polish and enough stretch for everyday wear.'
  },
  {
    id: 'purple-energy-set',
    name: 'NORÉA Amethyst Flow Set',
    category: 'Sets',
    price: 54,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'New Season',
    image: 'assets/images/09-minimalist-fashion-with-sleek-design.webp',
    description: 'A smooth activewear set with a confident fit, soft support and a polished shape from class to errands.'
  },
  {
    id: 'crop-tee-pack',
    name: 'NORÉA Signature Crop Tee',
    category: 'Tops',
    price: 32,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Essential',
    image: 'assets/images/14-modern-elegance-in-athletic-fashion.webp',
    description: 'A fitted crop tee with breathable comfort, clean NORÉA styling and an easy premium everyday shape.'
  },
  {
    id: 'yellow-three-piece',
    name: 'NORÉA Solace Three-Piece Set',
    category: 'Sets',
    price: 78,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Complete Set',
    image: 'assets/images/10-minimalist-athleisure-with-modern-elegance.webp',
    description: 'A complete jacket, sports bra and leggings set for a coordinated luxury activewear look.'
  },
  {
    id: 'contour-jacket-collection',
    name: 'NORÉA Tempo Zip Jacket',
    category: 'Jackets',
    price: 48,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Layering',
    image: 'assets/images/08-luxury-athleisure-in-motion.webp',
    description: 'A cropped zip jacket with contour lines, performance stretch and a clean finish for layering.'
  },
  {
    id: 'soft-power-collection',
    name: 'NORÉA Soft Power Set',
    category: 'Sets',
    price: 56,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Soft Power',
    image: 'assets/images/20-soft-power-in-minimal-design.webp',
    description: 'A soft, polished set with minimalist NORÉA energy, made for low-impact training and everyday styling.'
  },
  {
    id: 'details-pack',
    name: 'NORÉA Luxe Texture Set',
    category: 'Sets',
    price: 52,
    sizes: AVAILABLE_SIZES,
    colors: COLOR_NAMES,
    tag: 'Luxe Detail',
    image: 'assets/images/17-luxury-activewear-details-and-textures.webp',
    description: 'A detail-led activewear set focused on ribbed texture, smooth seams, polished zips and a premium finish.'
  }
];

const galleryImages = [
  { src: 'assets/images/01-confident-stride-in-serene-surroundings.webp', alt: 'confident stride in serene surroundings' },
  { src: 'assets/images/02-move-beautifully-live-confidently.webp', alt: 'move beautifully live confidently' },
  { src: 'assets/images/07-effortless-style-in-every-move.webp', alt: 'effortless style in every move' },
  { src: 'assets/images/11-athleisure-fashion-lookbook-with-nor-a.webp', alt: 'athleisure fashion lookbook with NORÉA' },
  { src: 'assets/images/12-effortless-elegance-in-activewear.webp', alt: 'effortless elegance in activewear' },
  { src: 'assets/images/15-a-clean-studio-fashion-catalog-composite-image-o.webp', alt: 'clean studio fashion catalog composite' },
  { src: 'assets/images/16-a-clean-commercial-catalog-lookbook-collage-imag.webp', alt: 'clean commercial catalog lookbook collage' },
  { src: 'assets/images/18-choose-your-energy-modern-activewear-style.webp', alt: 'choose your energy modern activewear style' },
  { src: 'assets/images/19-pure-form-minimalist-activewear-promo.webp', alt: 'pure form minimalist activewear promo' },
  { src: 'assets/images/21-performance-meets-elegance-in-activewear.webp', alt: 'performance meets elegance in activewear' },
  { src: 'assets/images/22-stylish-activewear-campaign-trio.webp', alt: 'stylish activewear campaign trio' },
  { src: 'assets/images/23-sky-motion-athleisure-collection-promo.webp', alt: 'sky motion athleisure collection promo' },
  { src: 'assets/images/24-blush-energy-athletic-elegance-in-pink.webp', alt: 'blush energy athletic elegance in pink' },
  { src: 'assets/images/25-confident-elegance-in-coordinated-athleisure.webp', alt: 'confident elegance in coordinated athleisure' },
  { src: 'assets/images/26-activewear-elegance-in-motion.webp', alt: 'activewear elegance in motion' },
  { src: 'assets/images/27-confident-athleisure-style-with-nor-a.webp', alt: 'confident athleisure style with NORÉA' },
  { src: 'assets/images/28-confident-activewear-fashion-in-neutral-tones.webp', alt: 'confident activewear fashion in neutral tones' },
  { src: 'assets/images/29-modern-elegance-in-athleisure-fashion.webp', alt: 'modern elegance in athleisure fashion' }
];

const ORDER_PHONE = '263776678288';
const money = (n) => 'USD ' + n.toFixed(2);
const optionText = (value) => Array.isArray(value) ? value.join(', ') : value;
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const selectId = (productId, type) => `${type}-${productId}`;
const colorPickerId = (productId, context = 'card') => `${context}-color-${productId}`;

let cart = JSON.parse(localStorage.getItem('noreaCart') || '[]');
let currentFilter = 'All';
let isCheckingOut = false;

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
    const color = product.colors.includes(item.color) ? item.color : product.colors[0];
    const qty = Number.parseInt(item.qty, 10);
    if (!Number.isInteger(qty) || qty < 1) return;

    const key = `${item.id}|${size}|${color}`;
    const existing = normalized.find(row => row.key === key);
    if (existing) existing.qty += qty;
    else normalized.push({ key, id: item.id, qty, size, color });
  });
  cart = normalized;
  localStorage.setItem('noreaCart', JSON.stringify(cart));
}

function getSelection(id, type) {
  const field = document.getElementById(selectId(id, type));
  return field ? field.value : '';
}

function getSelectedColor(id, context = 'card') {
  const picker = document.getElementById(colorPickerId(id, context));
  return picker ? picker.dataset.selectedColor : COLOR_NAMES[0];
}

function selectColor(id, colorName, context = 'card') {
  const picker = document.getElementById(colorPickerId(id, context));
  if (!picker) return;
  picker.dataset.selectedColor = colorName;
  $$('.swatch-option', picker).forEach(button => {
    button.classList.toggle('active', button.dataset.color === colorName);
  });
}

function scrollToShop() {
  closeCart();
  closeQuickView();
  document.body.classList.remove('menu-open');
  document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
}

function addToCart(id, size, color) {
  const product = products.find(p => p.id === id);
  if (!product) return openContact('NORÉA item');

  const selectedSize = size || getSelection(id, 'size') || product.sizes[0];
  const selectedColor = color || getSelectedColor(id, 'card') || product.colors[0];
  const key = `${id}|${selectedSize}|${selectedColor}`;
  const item = cart.find(i => i.key === key);

  if (item) item.qty += 1;
  else cart.push({ key, id, qty: 1, size: selectedSize, color: selectedColor });

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

function renderOptionSelect(product, type) {
  const values = type === 'size' ? product.sizes : product.colors;
  const label = type === 'size' ? 'Size' : 'Color';
  return `
    <label class="product-option">
      <span>${label}</span>
      <select id="${selectId(product.id, type)}">
        ${values.map(value => `<option value="${value}">${value}</option>`).join('')}
      </select>
    </label>
  `;
}

function renderColorPicker(product, context = 'card') {
  return `
    <div class="color-picker" id="${colorPickerId(product.id, context)}" data-selected-color="${product.colors[0]}">
      <span class="option-label">Color</span>
      <div class="swatch-list" role="list" aria-label="Choose color">
        ${product.colors.map((colorName, index) => {
          const color = AVAILABLE_COLORS.find(entry => entry.name === colorName);
          return `
            <button type="button" class="swatch-option ${index === 0 ? 'active' : ''}" data-color="${colorName}" onclick="selectColor('${product.id}', '${colorName}', '${context}')" aria-label="${colorName}">
              <span class="swatch-dot" style="--swatch:${color.hex}"></span>
              <span>${color.emoji} ${colorName}</span>
            </button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderProducts() {
  const grid = $('#productGrid');
  const filtered = currentFilter === 'All' ? products : products.filter(p => p.category === currentFilter);
  $('#productCount').textContent = `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'} shown`;

  grid.innerHTML = filtered.map(p => `
    <article class="product-card reveal">
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
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
        ${renderOptionSelect(p, 'size')}
      </div>
      ${renderColorPicker(p, 'card')}
      <button class="btn dark full" onclick="addToCart('${p.id}')">Add to bag</button>
    </article>
  `).join('');
  observeReveal();
}

function renderFilters() {
  const order = ['All', 'Sets', 'Jumpsuit', 'Shorts', 'Tops', 'Jackets', 'Lounge'];
  const available = new Set(products.map(p => p.category));
  const cats = order.filter(cat => cat === 'All' || available.has(cat));
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
    const colorMeta = AVAILABLE_COLORS.find(color => color.name === item.color) || AVAILABLE_COLORS[0];
    return `
      <div class="cart-row">
        <img src="${p.image}" alt="${p.name}" />
        <div>
          <strong>${p.name}</strong>
          <p>${item.size} / <span class="inline-swatch" style="--swatch:${colorMeta.hex}"></span>${item.color}</p>
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
      <div class="modal-image-wrap"><img src="${p.image}" alt="${p.name}" /></div>
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
        ${renderColorPicker(p, 'modal')}
        <p class="muted">Worldwide delivery in 10–15 business days. Secure online checkout in USD.</p>
        <strong class="modal-price">${money(p.price)}</strong>
        <div class="modal-actions">
          <button class="btn dark" onclick="addToCart('${p.id}', document.getElementById('modal-size-${p.id}').value, getSelectedColor('${p.id}', 'modal'))">Add to bag</button>
          <button class="btn light" onclick="closeQuickView()">Keep browsing</button>
        </div>
      </div>
    </div>`;
  document.body.classList.add('modal-open');
}

function closeQuickView() { document.body.classList.remove('modal-open'); }

function openContact(item = 'NORÉA order') {
  const message = encodeURIComponent(`Hi NORÉA, I need help with: ${item}. Please help me confirm size, color and delivery.`);
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

function init() {
  showCheckoutStatus();
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
