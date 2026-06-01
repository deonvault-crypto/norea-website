const COLORS = ['Black', 'Pink', 'Yellow', 'Blue', 'Brown', 'Red'];
const COLOR_HEX = { Black: '#111111', Pink: '#f4aac7', Yellow: '#f6d75f', Blue: '#4f8edb', Brown: '#5b3d32', Red: '#c73737' };
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const $ = (query) => document.querySelector(query);
const $$ = (query) => [...document.querySelectorAll(query)];
let catalog = [];

function setStatus(message) {
  $('#status').textContent = message;
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

function selectedCheckboxValues(name, fallback) {
  const values = $$(`input[name="${name}"]:checked`).map(input => input.value);
  return values.length ? values : fallback;
}

function productOptions() {
  if (!catalog.length) return '<option value="">Add a product first</option>';
  return catalog.map(product => `<option value="${product.id}">${product.name}</option>`).join('');
}

function renderSizeChecks() {
  $('#sizeChecks').innerHTML = SIZES.map(size => `
    <label class="check-pill"><input type="checkbox" name="sizes" value="${size}" checked /> ${size}</label>
  `).join('');
}

function renderColorChecks() {
  $('#colorChecks').innerHTML = COLORS.map(color => `
    <label class="check-pill"><input type="checkbox" name="colors" value="${color}" checked /> <span class="dot" style="--c:${COLOR_HEX[color]}"></span>${color}</label>
  `).join('');
}

function renderBulkColorUploads() {
  $('#bulkColorUploads').innerHTML = COLORS.map(color => `
    <div class="bulk-color-card">
      <div class="color-head"><span class="dot" style="--c:${COLOR_HEX[color]}"></span>${color}</div>
      <input id="colorFile-${color}" type="file" accept="image/png,image/jpeg,image/webp" />
      <div class="preview" id="preview-${color}"><span class="muted">${color} image preview</span></div>
    </div>
  `).join('');

  COLORS.forEach(color => {
    $(`#colorFile-${color}`).addEventListener('change', () => previewFile(`#colorFile-${color}`, `#preview-${color}`));
  });
}

function populateProducts() {
  $('#product').innerHTML = productOptions();
  $('#deleteProduct').innerHTML = productOptions();
  $('#productList').innerHTML = catalog.length
    ? catalog.map(product => `<div><strong>${product.name}</strong><br><span class="muted">${product.category} • USD ${Number(product.price).toFixed(2)} • Sizes: ${product.sizes.join(', ')} • Colors: ${product.colors.join(', ')}</span></div>`).join('')
    : '<p class="muted">No products yet. Add your first NORÉA product below.</p>';
}

async function loadCatalog() {
  const response = await fetch('/api/products?admin=' + Date.now());
  const data = await response.json();
  catalog = Array.isArray(data.products) ? data.products : [];
  populateProducts();
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}

async function resizeToWebp(dataUrl) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image preview.'));
    image.src = dataUrl;
  });

  const maxWidth = 1600;
  const maxHeight = 2000;
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/webp', 0.88);
}

function previewFile(inputId, previewId) {
  const file = $(inputId).files[0];
  if (!file) {
    $(previewId).innerHTML = '<span class="muted">Image preview will appear here</span>';
    return;
  }

  readAsDataUrl(file).then(dataUrl => {
    $(previewId).innerHTML = `<img src="${dataUrl}" alt="Selected image preview" />`;
  }).catch(error => setStatus(error.message));
}

async function getOptionalWebp(inputId) {
  const file = $(inputId).files[0];
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Please upload an image file.');
  const dataUrl = await readAsDataUrl(file);
  return resizeToWebp(dataUrl);
}

async function saveProduct() {
  const password = $('#password').value.trim();
  const name = $('#name').value.trim();

  if (!password) return setStatus('Please enter the admin password.');
  if (!name) return setStatus('Please enter the product name.');

  $('#saveProductBtn').disabled = true;
  setStatus('Saving product…');

  try {
    const product = {
      id: slugify(name),
      name,
      category: $('#category').value.trim() || 'Sets',
      price: Number($('#price').value || 0),
      tag: $('#tag').value.trim() || 'New',
      sizes: selectedCheckboxValues('sizes', SIZES),
      colors: selectedCheckboxValues('colors', COLORS),
      description: $('#description').value.trim(),
      active: true
    };

    if (!product.price || product.price < 1) throw new Error('Please enter a valid price.');

    const mainImageData = await getOptionalWebp('#mainImage');
    const response = await fetch('/api/admin/save-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify({ product, mainImageData })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Product save failed.');

    setStatus(`Product saved successfully.\n\n${result.product.name}\nSizes saved: ${result.product.sizes.join(', ')}\n\nNow upload all color images below in one click.`);
    await loadCatalog();
    $('#product').value = result.product.id;
  } catch (error) {
    setStatus(error.message);
  } finally {
    $('#saveProductBtn').disabled = false;
  }
}

async function collectColorImages() {
  const imagesByColor = {};
  for (const color of COLORS) {
    const fileInput = $(`#colorFile-${color}`);
    if (!fileInput || !fileInput.files[0]) continue;
    if (!fileInput.files[0].type.startsWith('image/')) throw new Error(`${color} must be an image file.`);
    setStatus(`Preparing ${color} image…`);
    const dataUrl = await readAsDataUrl(fileInput.files[0]);
    imagesByColor[color] = await resizeToWebp(dataUrl);
  }
  return imagesByColor;
}

async function uploadImages() {
  const password = $('#password').value.trim();
  const productId = $('#product').value;

  if (!password) return setStatus('Please enter the admin password.');
  if (!productId) return setStatus('Please add/select a product first.');

  $('#uploadBtn').disabled = true;
  setStatus('Preparing color images…');

  try {
    const imagesByColor = await collectColorImages();
    const colors = Object.keys(imagesByColor);
    if (!colors.length) throw new Error('Choose at least one color image to upload.');

    setStatus(`Uploading ${colors.length} color image${colors.length === 1 ? '' : 's'}…`);
    const response = await fetch('/api/admin/upload-color-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify({ productId, imagesByColor })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed.');

    setStatus(`Uploaded successfully.\n\nColors uploaded: ${result.colors.join(', ')}\n\nAfter deploy, customers clicking those colors will see the matching images.`);
    await loadCatalog();
  } catch (error) {
    setStatus(error.message);
  } finally {
    $('#uploadBtn').disabled = false;
  }
}

async function deleteProduct() {
  const password = $('#password').value.trim();
  const productId = $('#deleteProduct').value;
  if (!password) return setStatus('Please enter the admin password.');
  if (!productId) return setStatus('Choose a product to delete.');
  if (!confirm('Delete this product from the store?')) return;

  $('#deleteProductBtn').disabled = true;
  setStatus('Deleting product…');

  try {
    const response = await fetch('/api/admin/delete-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify({ productId })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Delete failed.');
    setStatus('Product deleted. The store will update after deploy.');
    await loadCatalog();
  } catch (error) {
    setStatus(error.message);
  } finally {
    $('#deleteProductBtn').disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSizeChecks();
  renderColorChecks();
  renderBulkColorUploads();
  loadCatalog().catch(error => setStatus(error.message));
  $('#mainImage').addEventListener('change', () => previewFile('#mainImage', '#mainPreview'));
  $('#saveProductBtn').addEventListener('click', saveProduct);
  $('#uploadBtn').addEventListener('click', uploadImages);
  $('#deleteProductBtn').addEventListener('click', deleteProduct);
});
