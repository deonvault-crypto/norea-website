
const products = [
  {
    "id": "contour-black-jumpsuit",
    "name": "Contour Line Jumpsuit",
    "category": "Jumpsuit",
    "price": 42,
    "colors": [
      "Black"
    ],
    "tag": "New Drop",
    "image": "assets/images/03-confident-style-in-minimalist-fashion-shot.webp",
    "description": "Sculpted black full-body activewear with contrast contour lines, zip front and a subtle NOR\u00c9A logo on top and bottom."
  },
  {
    "id": "grey-cutout-set",
    "name": "Sky Cutout Set",
    "category": "Sets",
    "price": 38,
    "colors": [
      "Grey"
    ],
    "tag": "Best Seller",
    "image": "assets/images/04-elevated-athleisure-for-every-movement.webp",
    "description": "A soft grey cutout training set with matching long-sleeve layer and high-waist leggings."
  },
  {
    "id": "black-cutout-set",
    "name": "Open Back Sculpt Set",
    "category": "Sets",
    "price": 39,
    "colors": [
      "Black"
    ],
    "tag": "Signature",
    "image": "assets/images/05-athleisure-elegance-with-confident-style.webp",
    "description": "Black open-back training set with sleek fit, stretch support and visible NOR\u00c9A branding."
  },
  {
    "id": "khaki-soft-set",
    "name": "Cloud Soft Lounge Set",
    "category": "Lounge",
    "price": 45,
    "colors": [
      "Khaki"
    ],
    "tag": "Premium",
    "image": "assets/images/06-modern-athletic-fashion-advert-with-model.webp",
    "description": "Soft neutral lounge set with ribbed texture, cropped jacket and flared pants."
  },
  {
    "id": "purple-energy-set",
    "name": "Purple Energy Set",
    "category": "Sets",
    "price": 36,
    "colors": [
      "Purple"
    ],
    "tag": "Limited",
    "image": "assets/images/09-minimalist-fashion-with-sleek-design.webp",
    "description": "Purple active set for everyday movement, styled with clean lines and a confident fit."
  },
  {
    "id": "pink-short-set",
    "name": "Blush Short Set",
    "category": "Shorts",
    "price": 32,
    "colors": [
      "Pink"
    ],
    "tag": "Popular",
    "image": "assets/images/13-confident-elegance-in-activewear-styling.webp",
    "description": "Pink short active set with top-and-bottom NOR\u00c9A branding for a light summer training look."
  },
  {
    "id": "crop-tee-pack",
    "name": "Signature Crop Tee Pack",
    "category": "Tops",
    "price": 29,
    "colors": [
      "Black",
      "Brown",
      "Burgundy",
      "White"
    ],
    "tag": "4 Colors",
    "image": "assets/images/14-modern-elegance-in-athletic-fashion.webp",
    "description": "Essential crop tee collection in black, brown, burgundy and white. Minimal, breathable and fitted."
  },
  {
    "id": "yellow-three-piece",
    "name": "Pale Yellow 3-Piece Set",
    "category": "Sets",
    "price": 48,
    "colors": [
      "Pale Yellow"
    ],
    "tag": "Complete Set",
    "image": "assets/images/10-minimalist-athleisure-with-modern-elegance.webp",
    "description": "Complete pale yellow jacket, sports bra and leggings set for a soft luxury activewear look."
  },
  {
    "id": "contour-jacket-collection",
    "name": "Contour Jacket Collection",
    "category": "Jackets",
    "price": 34,
    "colors": [
      "Black",
      "Red",
      "White"
    ],
    "tag": "3 Pack Look",
    "image": "assets/images/08-luxury-athleisure-in-motion.webp",
    "description": "Cropped contour zip jackets in white, red and black with performance stretch and clean NOR\u00c9A logo."
  },
  {
    "id": "pink-brown-duo",
    "name": "Blush & Brown Zip Duo",
    "category": "Sets",
    "price": 41,
    "colors": [
      "Pink",
      "Brown"
    ],
    "tag": "Duo Style",
    "image": "assets/images/09-minimalist-fashion-with-sleek-design.webp",
    "description": "Two soft-toned zip sets in pink and brown, designed for elevated everyday styling."
  },
  {
    "id": "soft-power-collection",
    "name": "Soft Power Collection",
    "category": "Sets",
    "price": 40,
    "colors": [
      "Pink",
      "White"
    ],
    "tag": "Editorial",
    "image": "assets/images/20-soft-power-in-minimal-design.webp",
    "description": "Clean editorial campaign set focused on soft tones, confident shapes and premium minimalist styling."
  },
  {
    "id": "details-pack",
    "name": "Details That Matter",
    "category": "Details",
    "price": 0,
    "colors": [
      "White",
      "Blue",
      "Pink"
    ],
    "tag": "Fabric Story",
    "image": "assets/images/17-luxury-activewear-details-and-textures.webp",
    "description": "Fabric and logo detail board for showing customers the ribbed texture, zippers, waistband and thumb-hole finish."
  }
];
const galleryImages = [
  {
    "src": "assets/images/01-confident-stride-in-serene-surroundings.webp",
    "alt": "confident stride in serene surroundings"
  },
  {
    "src": "assets/images/02-move-beautifully-live-confidently.webp",
    "alt": "move beautifully live confidently"
  },
  {
    "src": "assets/images/07-effortless-style-in-every-move.webp",
    "alt": "effortless style in every move"
  },
  {
    "src": "assets/images/11-athleisure-fashion-lookbook-with-nor-a.webp",
    "alt": "athleisure fashion lookbook with nor\u00e9a"
  },
  {
    "src": "assets/images/12-effortless-elegance-in-activewear.webp",
    "alt": "effortless elegance in activewear"
  },
  {
    "src": "assets/images/15-a-clean-studio-fashion-catalog-composite-image-o.webp",
    "alt": "a clean studio fashion catalog composite image o"
  },
  {
    "src": "assets/images/16-a-clean-commercial-catalog-lookbook-collage-imag.webp",
    "alt": "a clean commercial catalog lookbook collage imag"
  },
  {
    "src": "assets/images/18-choose-your-energy-modern-activewear-style.webp",
    "alt": "choose your energy modern activewear style"
  },
  {
    "src": "assets/images/19-pure-form-minimalist-activewear-promo.webp",
    "alt": "pure form minimalist activewear promo"
  },
  {
    "src": "assets/images/21-performance-meets-elegance-in-activewear.webp",
    "alt": "performance meets elegance in activewear"
  },
  {
    "src": "assets/images/22-stylish-activewear-campaign-trio.webp",
    "alt": "stylish activewear campaign trio"
  },
  {
    "src": "assets/images/23-sky-motion-athleisure-collection-promo.webp",
    "alt": "sky motion athleisure collection promo"
  },
  {
    "src": "assets/images/24-blush-energy-athletic-elegance-in-pink.webp",
    "alt": "blush energy athletic elegance in pink"
  },
  {
    "src": "assets/images/25-confident-elegance-in-coordinated-athleisure.webp",
    "alt": "confident elegance in coordinated athleisure"
  },
  {
    "src": "assets/images/26-activewear-elegance-in-motion.webp",
    "alt": "activewear elegance in motion"
  },
  {
    "src": "assets/images/27-confident-athleisure-style-with-nor-a.webp",
    "alt": "confident athleisure style with nor\u00e9a"
  },
  {
    "src": "assets/images/28-confident-activewear-fashion-in-neutral-tones.webp",
    "alt": "confident activewear fashion in neutral tones"
  },
  {
    "src": "assets/images/29-modern-elegance-in-athleisure-fashion.webp",
    "alt": "modern elegance in athleisure fashion"
  },
  {
    "src": "assets/images/30-fitness-fashion-cropped-zip-training-jackets.webp",
    "alt": "fitness fashion cropped zip training jackets"
  },
  {
    "src": "assets/images/31-minimalist-fashion-essentials-advertisement.webp",
    "alt": "minimalist fashion essentials advertisement"
  },
  {
    "src": "assets/images/32-confident-style-in-natural-light.webp",
    "alt": "confident style in natural light"
  },
  {
    "src": "assets/images/33-relaxed-moment-in-a-pilates-studio.webp",
    "alt": "relaxed moment in a pilates studio"
  },
  {
    "src": "assets/images/34-essential-activewear-essentials-in-minimal-style.webp",
    "alt": "essential activewear essentials in minimal style"
  },
  {
    "src": "assets/images/35-timeless-design-meets-performance.webp",
    "alt": "timeless design meets performance"
  },
  {
    "src": "assets/images/36-focused-strength-in-the-gym.webp",
    "alt": "focused strength in the gym"
  },
  {
    "src": "assets/images/37-a-bright-airy-indoor-lifestyle-fitness-fashion-ad.webp",
    "alt": "a bright airy indoor lifestyle fitness fashion ad"
  },
  {
    "src": "assets/images/38-a-bright-airy-modern-fitness-studio-interior-scen.webp",
    "alt": "a bright airy modern fitness studio interior scen"
  },
  {
    "src": "assets/images/39-a-bright-high-end-activewear-fashion-advertisemen.webp",
    "alt": "a bright high end activewear fashion advertisemen"
  },
  {
    "src": "assets/images/40-a-clean-high-fashion-activewear-advertisement-in.webp",
    "alt": "a clean high fashion activewear advertisement in"
  },
  {
    "src": "assets/images/41-a-clean-minimal-fashion-product-advertisement-l.webp",
    "alt": "a clean minimal fashion product advertisement l"
  },
  {
    "src": "assets/images/42-a-clean-modern-product-ad-scene-with-a-neutral-be.webp",
    "alt": "a clean modern product ad scene with a neutral be"
  },
  {
    "src": "assets/images/43-a-clean-studio-fashion-advertisement-scene-high-e.webp",
    "alt": "a clean studio fashion advertisement scene high e"
  },
  {
    "src": "assets/images/44-a-clean-studio-fashion-commercial-composite-scene.webp",
    "alt": "a clean studio fashion commercial composite scene"
  },
  {
    "src": "assets/images/45-a-high-resolution-cinematic-indoor-boxing-gym-sce.webp",
    "alt": "a high resolution cinematic indoor boxing gym sce"
  },
  {
    "src": "assets/images/46-a-wide-outdoor-rooftop-gym-fitness-setting-at-gold.webp",
    "alt": "a wide outdoor rooftop gym fitness setting at gold"
  },
  {
    "src": "assets/images/47-coastal-athleisure-style-with-modern-elegance.webp",
    "alt": "coastal athleisure style with modern elegance"
  },
  {
    "src": "assets/images/48-confident-athleisure-style-in-harmony.webp",
    "alt": "confident athleisure style in harmony"
  },
  {
    "src": "assets/images/49-confident-elegance-in-activewear.webp",
    "alt": "confident elegance in activewear"
  },
  {
    "src": "assets/images/50-confident-elegance-in-activewear-fashion.webp",
    "alt": "confident elegance in activewear fashion"
  },
  {
    "src": "assets/images/51-confident-elegance-in-athletic-fashion.webp",
    "alt": "confident elegance in athletic fashion"
  }
];

const money = (n) => n === 0 ? 'Coming soon' : 'US$' + n.toFixed(2);
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];

let cart = JSON.parse(localStorage.getItem('noreaCart') || '[]');
let currentFilter = 'All';

function saveCart() {
  localStorage.setItem('noreaCart', JSON.stringify(cart));
  renderCart();
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product || product.price === 0) return openContact(product?.name || 'NORÉA item');
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function changeQty(id, diff) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += diff;
  if (item.qty <= 0) removeFromCart(id);
  saveCart();
}

function renderProducts() {
  const grid = $('#productGrid');
  const filtered = currentFilter === 'All' ? products : products.filter(p => p.category === currentFilter);
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
      <p class="muted small">${p.colors.join(' • ')}</p>
      <button class="btn dark full" onclick="addToCart('${p.id}')">${p.price === 0 ? 'Ask about this' : 'Add to cart'}</button>
    </article>
  `).join('');
  observeReveal();
}

function renderFilters() {
  const cats = ['All', ...new Set(products.map(p => p.category))];
  $('#filters').innerHTML = cats.map(cat => `
    <button class="chip ${cat === currentFilter ? 'active' : ''}" onclick="setFilter('${cat}')">${cat}</button>
  `).join('');
}

function setFilter(cat) {
  currentFilter = cat;
  renderFilters();
  renderProducts();
}

function renderGallery() {
  const gallery = $('#galleryGrid');
  gallery.innerHTML = galleryImages.slice(0, 18).map((g, i) => `
    <figure class="gallery-item reveal ${i % 5 === 0 ? 'wide' : ''}">
      <img src="${g.src}" alt="NORÉA lookbook image" loading="lazy" />
    </figure>
  `).join('');
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $$('.cart-count').forEach(el => el.textContent = count);
  const list = $('#cartItems');
  if (!cart.length) {
    list.innerHTML = '<p class="empty">Your cart is empty. Add your favourite NORÉA pieces.</p>';
    $('#cartTotal').textContent = 'US$0.00';
    return;
  }
  let total = 0;
  list.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    if (!p) return '';
    total += p.price * item.qty;
    return `
      <div class="cart-row">
        <img src="${p.image}" alt="${p.name}" />
        <div>
          <strong>${p.name}</strong>
          <p>${money(p.price)}</p>
          <div class="qty">
            <button onclick="changeQty('${p.id}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${p.id}', 1)">+</button>
          </div>
        </div>
        <button class="icon-only" onclick="removeFromCart('${p.id}')" aria-label="Remove item">×</button>
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
    <button class="modal-close" onclick="closeQuickView()" aria-label="Close quick view">×</button>
    <div class="modal-grid">
      <img src="${p.image}" alt="${p.name}" />
      <div class="modal-copy">
        <p class="eyebrow">${p.category} • ${p.tag}</p>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <p class="muted">Available colors: ${p.colors.join(', ')}</p>
        <strong class="modal-price">${money(p.price)}</strong>
        <button class="btn dark" onclick="addToCart('${p.id}')">${p.price === 0 ? 'Ask about this' : 'Add to cart'}</button>
      </div>
    </div>`;
  document.body.classList.add('modal-open');
}

function closeQuickView() { document.body.classList.remove('modal-open'); }

function openContact(item = 'NORÉA order') {
  const message = encodeURIComponent(`Hi NORÉA, I am interested in: ${item}`);
  window.location.href = `https://wa.me/263000000000?text=${message}`;
}

function checkoutWhatsApp() {
  if (!cart.length) return;
  const lines = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    return `${item.qty} x ${p.name}`;
  }).join('%0A');
  const total = $('#cartTotal').textContent;
  window.location.href = `https://wa.me/263000000000?text=Hi%20NOR%C3%89A%2C%20I%20want%20to%20order%3A%0A${lines}%0ATotal%3A%20${encodeURIComponent(total)}`;
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
  renderFilters();
  renderProducts();
  renderGallery();
  renderCart();
  $('#cartButton').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartOverlay').addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', checkoutWhatsApp);
  $('#mobileMenu').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeQuickView(); } });
  observeReveal();
}

document.addEventListener('DOMContentLoaded', init);
