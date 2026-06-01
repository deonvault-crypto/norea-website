(() => {
  const COLOR_META = {
    Black: { hex: '#111111', tint: 'rgba(17,17,17,.56)', opacity: '.28' },
    Pink: { hex: '#f4aac7', tint: 'rgba(244,170,199,.62)', opacity: '.34' },
    Yellow: { hex: '#f6d75f', tint: 'rgba(246,215,95,.56)', opacity: '.30' },
    Blue: { hex: '#4f8edb', tint: 'rgba(79,142,219,.56)', opacity: '.32' },
    Brown: { hex: '#5b3d32', tint: 'rgba(91,61,50,.58)', opacity: '.32' },
    Red: { hex: '#c73737', tint: 'rgba(199,55,55,.56)', opacity: '.32' }
  };

  const missingImages = new Set();
  const originalOpenQuickView = window.openQuickView;

  function productList() {
    return typeof products !== 'undefined' ? products : [];
  }

  function getProduct(id) {
    return productList().find(product => product.id === id);
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function colorPath(product, colorName) {
    const key = `${product.id}:${colorName}`;
    if (missingImages.has(key)) return product.image;
    if (product.imagesByColor && product.imagesByColor[colorName]) return product.imagesByColor[colorName];
    return `assets/images/${product.id}-${slug(colorName)}.webp`;
  }

  function installStyles() {
    if (document.getElementById('norea-color-switch-styles')) return;

    const style = document.createElement('style');
    style.id = 'norea-color-switch-styles';
    style.textContent = `
      .color-sensitive{position:relative;overflow:hidden;--product-tint:transparent;--tint-opacity:0;}
      .color-sensitive:after{content:"";position:absolute;inset:0;background:var(--product-tint);opacity:var(--tint-opacity);mix-blend-mode:multiply;pointer-events:none;transition:background .25s ease,opacity .25s ease;z-index:1;}
      .color-sensitive img{position:relative;z-index:0;transition:opacity .22s ease,transform .7s ease,filter .22s ease;}
      .product-image-wrap .product-badge,.product-image-wrap .quick-view{z-index:2;}
      .color-switching{opacity:.38;}
      .cart-image-wrap{width:82px;height:100px;border-radius:.8rem;background:var(--stone);}
      .cart-image-wrap img{width:100%;height:100%;object-fit:cover;border-radius:.8rem;}
      .swatch-option span:last-child{letter-spacing:.01em;}
    `;
    document.head.appendChild(style);
  }

  function colorMeta(colorName) {
    return COLOR_META[colorName] || COLOR_META.Black;
  }

  function applyTint(wrap, colorName) {
    if (!wrap) return;
    const meta = colorMeta(colorName);
    wrap.classList.add('color-sensitive');
    wrap.style.setProperty('--product-tint', meta.tint);
    wrap.style.setProperty('--tint-opacity', meta.opacity);
    wrap.dataset.selectedColor = colorName;
  }

  function swapImage(img, product, colorName) {
    if (!img || !product) return;

    const key = `${product.id}:${colorName}`;
    const nextSrc = colorPath(product, colorName);
    img.dataset.defaultSrc = product.image;
    img.dataset.colorImageKey = key;
    img.dataset.currentColor = colorName;

    if (img.src.endsWith(nextSrc)) return;

    img.classList.add('color-switching');
    img.onload = () => img.classList.remove('color-switching');
    img.onerror = () => {
      missingImages.add(key);
      img.onerror = null;
      img.src = product.image;
      img.classList.remove('color-switching');
    };
    img.src = nextSrc;
  }

  function getProductCard(id) {
    return [...document.querySelectorAll('.product-card')].find(card => {
      const button = card.querySelector('.quick-view');
      return button && button.getAttribute('onclick')?.includes(`'${id}'`);
    });
  }

  function cleanSwatches(root = document) {
    root.querySelectorAll('.swatch-option').forEach(button => {
      const label = button.querySelector('span:last-child');
      if (label) label.textContent = button.dataset.color || label.textContent.replace(/[⚫️🌸🟡🔵🟤🔴]/g, '').trim();
    });
  }

  function updatePicker(picker, colorName) {
    if (!picker) return;
    picker.dataset.selectedColor = colorName;
    picker.querySelectorAll('.swatch-option').forEach(button => {
      button.classList.toggle('active', button.dataset.color === colorName);
    });
  }

  function updateCardImage(id, colorName) {
    const product = getProduct(id);
    const card = getProductCard(id);
    if (!product || !card) return;

    const wrap = card.querySelector('.product-image-wrap');
    const img = wrap?.querySelector('img');
    applyTint(wrap, colorName);
    swapImage(img, product, colorName);
  }

  function updateModalImage(id, colorName) {
    const product = getProduct(id);
    const wrap = document.querySelector('#modalContent .modal-image-wrap');
    const img = wrap?.querySelector('img');
    if (!product || !wrap || !img) return;

    applyTint(wrap, colorName);
    swapImage(img, product, colorName);
  }

  window.selectColor = function selectColorWithImage(id, colorName, context = 'card') {
    const picker = document.getElementById(`${context}-color-${id}`);
    updatePicker(picker, colorName);
    cleanSwatches(picker || document);

    if (context === 'modal') updateModalImage(id, colorName);
    else updateCardImage(id, colorName);
  };

  if (typeof originalOpenQuickView === 'function') {
    window.openQuickView = function openQuickViewWithColor(id) {
      originalOpenQuickView(id);
      requestAnimationFrame(() => {
        const cardColor = document.getElementById(`card-color-${id}`)?.dataset.selectedColor || 'Black';
        updatePicker(document.getElementById(`modal-color-${id}`), cardColor);
        cleanSwatches(document.getElementById('modalContent'));
        updateModalImage(id, cardColor);
      });
    };
  }

  function enhanceProductCards() {
    productList().forEach(product => {
      const colorName = document.getElementById(`card-color-${product.id}`)?.dataset.selectedColor || 'Black';
      updatePicker(document.getElementById(`card-color-${product.id}`), colorName);
      updateCardImage(product.id, colorName);
    });
    cleanSwatches();
  }

  function enhanceCartImages() {
    document.querySelectorAll('.cart-row').forEach(row => {
      const details = row.textContent || '';
      const colorName = Object.keys(COLOR_META).find(color => details.includes(color));
      if (!colorName) return;
      const img = row.querySelector('img');
      if (!img) return;
      const wrap = img.parentElement;
      applyTint(wrap, colorName);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    installStyles();
    enhanceProductCards();
    enhanceCartImages();

    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
      new MutationObserver(() => requestAnimationFrame(enhanceProductCards)).observe(productGrid, { childList: true });
    }

    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
      new MutationObserver(() => requestAnimationFrame(enhanceCartImages)).observe(cartItems, { childList: true, subtree: true });
    }
  });
})();
