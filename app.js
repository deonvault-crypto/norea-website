
const products = [
  {
    "id": "contour-black-jumpsuit",
    "name": "NORÉA Eclipse Sculpt Jumpsuit",
    "category": "Jumpsuit",
    "price": 72,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Signature",
    "image": "assets/images/03-confident-style-in-minimalist-fashion-shot.webp",
    "description": "A premium sculpted jumpsuit with a sleek zip front, supportive stretch and polished NORÉA contour detailing."
  },
  {
    "id": "grey-cutout-set",
    "name": "NORÉA Aura Cutout Set",
    "category": "Sets",
    "price": 58,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Best Seller",
    "image": "assets/images/04-elevated-athleisure-for-every-movement.webp",
    "description": "A refined cutout active set with a long-sleeve layer, high-waist leggings and smooth all-day comfort."
  },
  {
    "id": "black-cutout-set",
    "name": "NORÉA Onyx Open-Back Set",
    "category": "Sets",
    "price": 60,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Sculpt Fit",
    "image": "assets/images/05-athleisure-elegance-with-confident-style.webp",
    "description": "A sculpted open-back training set made for confident movement, clean lines and a premium studio look."
  },
  {
    "id": "khaki-soft-set",
    "name": "NORÉA Drift Lounge Set",
    "category": "Lounge",
    "price": 64,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Soft Touch",
    "image": "assets/images/06-modern-athletic-fashion-advert-with-model.webp",
    "description": "A soft lounge set with a cropped jacket feel, relaxed polish and enough stretch for everyday wear."
  },
  {
    "id": "purple-energy-set",
    "name": "NORÉA Amethyst Flow Set",
    "category": "Sets",
    "price": 54,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "New Season",
    "image": "assets/images/09-minimalist-fashion-with-sleek-design.webp",
    "description": "A smooth activewear set with a confident fit, soft support and a polished shape from class to errands."
  },
  {
    "id": "pink-short-set",
    "name": "NORÉA Blush Sprint Set",
    "category": "Shorts",
    "price": 46,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Popular",
    "image": "assets/images/13-confident-elegance-in-activewear-styling.webp",
    "description": "A light short set for warm training days, styled with a fitted top and easy movement through every rep."
  },
  {
    "id": "crop-tee-pack",
    "name": "NORÉA Signature Crop Tee",
    "category": "Tops",
    "price": 32,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Essential",
    "image": "assets/images/14-modern-elegance-in-athletic-fashion.webp",
    "description": "A fitted crop tee with breathable comfort, clean NORÉA styling and an easy premium everyday shape."
  },
  {
    "id": "yellow-three-piece",
    "name": "NORÉA Solace Three-Piece Set",
    "category": "Sets",
    "price": 78,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Complete Set",
    "image": "assets/images/10-minimalist-athleisure-with-modern-elegance.webp",
    "description": "A complete jacket, sports bra and leggings set for a coordinated luxury activewear look."
  },
  {
    "id": "contour-jacket-collection",
    "name": "NORÉA Tempo Zip Jacket",
    "category": "Jackets",
    "price": 48,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Layering",
    "image": "assets/images/08-luxury-athleisure-in-motion.webp",
    "description": "A cropped zip jacket with contour lines, performance stretch and a clean finish for layering."
  },
  {
    "id": "pink-brown-duo",
    "name": "NORÉA Muse Zip Set",
    "category": "Sets",
    "price": 62,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Elevated",
    "image": "assets/images/09-minimalist-fashion-with-sleek-design.webp",
    "description": "A sleek zip activewear set designed for an elevated fit, smooth support and all-day versatility."
  },
  {
    "id": "soft-power-collection",
    "name": "NORÉA Soft Power Set",
    "category": "Sets",
    "price": 56,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Soft Power",
    "image": "assets/images/20-soft-power-in-minimal-design.webp",
    "description": "A soft, polished set with minimalist NORÉA energy, made for low-impact training and everyday styling."
  },
  {
    "id": "details-pack",
    "name": "NORÉA Luxe Texture Set",
    "category": "Sets",
    "price": 52,
    "sizes": [
      "All sizes"
    ],
    "colors": [
      "All colors"
    ],
    "tag": "Luxe Detail",
    "image": "assets/images/17-luxury-activewear-details-and-textures.webp",
    "description": "A detail-led activewear set focused on ribbed texture, smooth seams, polished zips and a premium finish."
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

const ORDER_PHONE = '263776678288';
const money = (n) => 'USD ' + n.toFixed(2);
const optionText = (value) => Array.isArray(value) ? value.join(', ') : value;
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
  if (!product) return openContact('NORÉA item');
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
      <p class="muted small">Sizes: ${optionText(p.sizes)} &bull; Colors: ${optionText(p.colors)}</p>
      <button class="btn dark full" onclick="addToCart('${p.id}')">Add to cart</button>
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
        <p class="muted">Sizes: ${optionText(p.sizes)}</p>
        <p class="muted">Colors: ${optionText(p.colors)}</p>
        <p class="muted">Nation-wide delivery in 6–10 days. USD, ZiG and Rand accepted.</p>
        <strong class="modal-price">${money(p.price)}</strong>
        <button class="btn dark" onclick="addToCart('${p.id}')">Add to cart</button>
      </div>
    </div>`;
  document.body.classList.add('modal-open');
}

function closeQuickView() { document.body.classList.remove('modal-open'); }

function openContact(item = 'NORÉA order') {
  const message = encodeURIComponent(`Hi NORÉA, I am interested in: ${item}. Please help me confirm size, color, payment and delivery.`);
  window.location.href = `https://wa.me/${ORDER_PHONE}?text=${message}`;
}

function checkoutWhatsApp() {
  if (!cart.length) return;
  const lines = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    return `${item.qty} x ${p.name} - ${money(p.price)} each`;
  }).join('\n');
  const total = $('#cartTotal').textContent;
  const message = `Hi NORÉA, I want to order:\n${lines}\nTotal: ${total}\n\nPlease help me confirm my preferred sizes and colors. I understand delivery is nation-wide in 6–10 days and payment can be made in USD, ZiG or Rand.`;
  window.location.href = `https://wa.me/${ORDER_PHONE}?text=${encodeURIComponent(message)}`;
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
