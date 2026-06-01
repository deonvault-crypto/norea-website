(() => {
  const COLOR_META = {
    Black: { hex: '#111111', rgb: [17, 17, 17] },
    Pink: { hex: '#f4aac7', rgb: [244, 170, 199] },
    Yellow: { hex: '#f6d75f', rgb: [246, 215, 95] },
    Blue: { hex: '#4f8edb', rgb: [79, 142, 219] },
    Brown: { hex: '#5b3d32', rgb: [91, 61, 50] },
    Red: { hex: '#c73737', rgb: [199, 55, 55] }
  };

  const originalOpenQuickView = window.openQuickView;
  const recolorCache = new Map();
  const pendingRecolors = new Map();
  const uploadedImageCache = new Map();

  function productList() {
    return typeof products !== 'undefined' ? products : [];
  }

  function getProduct(id) {
    return productList().find(product => product.id === id);
  }

  function getColorMeta(colorName) {
    return COLOR_META[colorName] || COLOR_META.Black;
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function uploadedColorPath(product, colorName) {
    return `assets/images/${product.id}-${slug(colorName)}.webp`;
  }

  function installStyles() {
    if (document.getElementById('norea-color-switch-styles')) return;

    const style = document.createElement('style');
    style.id = 'norea-color-switch-styles';
    style.textContent = `
      .product-image-wrap,.modal-image-wrap,.cart-image-wrap{position:relative;overflow:hidden;}
      .product-image-wrap:after,.modal-image-wrap:after,.cart-image-wrap:after{display:none!important;}
      .product-image-wrap img,.modal-image-wrap img,.cart-image-wrap img{transition:opacity .22s ease,transform .7s ease,filter .22s ease;}
      .product-image-wrap .product-badge,.product-image-wrap .quick-view{z-index:2;}
      .color-switching{opacity:.32;filter:blur(.6px);}
      .cart-image-wrap{width:82px;height:100px;border-radius:.8rem;background:var(--stone);}
      .cart-image-wrap img{width:100%;height:100%;object-fit:cover;border-radius:.8rem;}
      .swatch-option span:last-child{letter-spacing:.01em;}
    `;
    document.head.appendChild(style);
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

  function getProductCard(id) {
    return [...document.querySelectorAll('.product-card')].find(card => {
      const button = card.querySelector('.quick-view');
      return button && button.getAttribute('onclick')?.includes(`'${id}'`);
    });
  }

  function getOriginalSrc(img, product) {
    if (!img.dataset.originalSrc) img.dataset.originalSrc = product.image || img.currentSrc || img.src;
    return img.dataset.originalSrc;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function getUploadedImageIfExists(product, colorName) {
    const src = uploadedColorPath(product, colorName);
    if (uploadedImageCache.has(src)) return uploadedImageCache.get(src);

    try {
      await loadImage(src);
      uploadedImageCache.set(src, src);
      return src;
    } catch {
      uploadedImageCache.set(src, null);
      return null;
    }
  }

  function isSkinPixel(r, g, b, luma) {
    return luma > 40 && luma < 175 && r > g * 1.12 && r > b * 1.18 && g > b * .82;
  }

  function shouldRecolorPixel(r, g, b, x, y, width, height) {
    const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const relY = y / height;
    const relX = x / width;

    if (luma > 145) return false;
    if (relY < .16 || relY > .91) return false;
    if (isSkinPixel(r, g, b, luma)) return false;

    const isDarkGarment = luma < 105;
    const isMidGarment = luma < 132 && Math.abs(r - g) < 35 && Math.abs(g - b) < 35;
    const inBodyZone = (relX > .10 && relX < .48) || (relX > .52 && relX < .90);

    return inBodyZone && (isDarkGarment || isMidGarment);
  }

  function recolorPixel(r, g, b, targetRgb) {
    const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const shade = Math.max(.45, Math.min(1.22, .66 + (luma / 255)));
    const texture = Math.max(-18, Math.min(18, luma - 55));

    return [
      Math.max(0, Math.min(255, targetRgb[0] * shade + texture)),
      Math.max(0, Math.min(255, targetRgb[1] * shade + texture)),
      Math.max(0, Math.min(255, targetRgb[2] * shade + texture))
    ];
  }

  async function createColorCopy(src, colorName) {
    if (colorName === 'Black') return src;

    const cacheKey = `${src}|${colorName}`;
    if (recolorCache.has(cacheKey)) return recolorCache.get(cacheKey);
    if (pendingRecolors.has(cacheKey)) return pendingRecolors.get(cacheKey);

    const promise = (async () => {
      const source = await loadImage(src);
      const canvas = document.createElement('canvas');
      const width = source.naturalWidth || source.width;
      const height = source.naturalHeight || source.height;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(source, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const targetRgb = getColorMeta(colorName).rgb;

      for (let i = 0; i < data.length; i += 4) {
        const pixel = i / 4;
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (!shouldRecolorPixel(r, g, b, x, y, width, height)) continue;

        const [nr, ng, nb] = recolorPixel(r, g, b, targetRgb);
        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
      }

      ctx.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL('image/png');
      recolorCache.set(cacheKey, result);
      pendingRecolors.delete(cacheKey);
      return result;
    })().catch(error => {
      pendingRecolors.delete(cacheKey);
      console.warn('NORÉA color image generation failed:', error);
      return src;
    });

    pendingRecolors.set(cacheKey, promise);
    return promise;
  }

  async function getImageForColor(img, product, colorName) {
    const uploaded = await getUploadedImageIfExists(product, colorName);
    if (uploaded) return uploaded;
    return createColorCopy(getOriginalSrc(img, product), colorName);
  }

  async function swapToColor(img, product, colorName) {
    if (!img || !product) return;

    getOriginalSrc(img, product);
    img.dataset.currentColor = colorName;
    img.classList.add('color-switching');

    const nextSrc = await getImageForColor(img, product, colorName);

    if (img.dataset.currentColor === colorName) {
      img.onload = () => img.classList.remove('color-switching');
      img.onerror = () => img.classList.remove('color-switching');
      img.src = nextSrc;
      if (nextSrc.startsWith('data:')) setTimeout(() => img.classList.remove('color-switching'), 60);
    }
  }

  function updateCardImage(id, colorName) {
    const product = getProduct(id);
    const card = getProductCard(id);
    if (!product || !card) return;

    const img = card.querySelector('.product-image-wrap img');
    swapToColor(img, product, colorName);
  }

  function updateModalImage(id, colorName) {
    const product = getProduct(id);
    const img = document.querySelector('#modalContent .modal-image-wrap img');
    if (!product || !img) return;
    swapToColor(img, product, colorName);
  }

  window.selectColor = function selectColorWithManualImage(id, colorName, context = 'card') {
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

      const productName = row.querySelector('strong')?.textContent?.trim();
      const product = productList().find(item => item.name === productName);
      const img = row.querySelector('img');
      if (product && img) swapToColor(img, product, colorName);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    installStyles();
    cleanSwatches();

    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
      requestAnimationFrame(enhanceProductCards);
      new MutationObserver(() => requestAnimationFrame(enhanceProductCards)).observe(productGrid, { childList: true });
    }

    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
      new MutationObserver(() => requestAnimationFrame(enhanceCartImages)).observe(cartItems, { childList: true, subtree: true });
    }
  });
})();
