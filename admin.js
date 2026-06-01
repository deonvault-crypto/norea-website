const PRODUCTS = [
  ['pink-brown-duo', 'NORÉA Muse Zip Set'],
  ['pink-short-set', 'NORÉA Blush Sprint Set'],
  ['contour-black-jumpsuit', 'NORÉA Eclipse Sculpt Jumpsuit'],
  ['grey-cutout-set', 'NORÉA Aura Cutout Set'],
  ['black-cutout-set', 'NORÉA Onyx Open-Back Set'],
  ['khaki-soft-set', 'NORÉA Drift Lounge Set'],
  ['purple-energy-set', 'NORÉA Amethyst Flow Set'],
  ['crop-tee-pack', 'NORÉA Signature Crop Tee'],
  ['yellow-three-piece', 'NORÉA Solace Three-Piece Set'],
  ['contour-jacket-collection', 'NORÉA Tempo Zip Jacket'],
  ['soft-power-collection', 'NORÉA Soft Power Set'],
  ['details-pack', 'NORÉA Luxe Texture Set']
];

const COLORS = ['Black', 'Pink', 'Yellow', 'Blue', 'Brown', 'Red'];
const $ = (query) => document.querySelector(query);

function setStatus(message) {
  $('#status').textContent = message;
}

function populateSelects() {
  $('#product').innerHTML = PRODUCTS.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
  $('#color').innerHTML = COLORS.map(color => `<option value="${color}">${color}</option>`).join('');
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
  return canvas.toDataURL('image/webp', 0.9);
}

function previewFile() {
  const file = $('#file').files[0];
  if (!file) {
    $('#preview').innerHTML = '<span class="muted">Image preview will appear here</span>';
    return;
  }

  readAsDataUrl(file).then(dataUrl => {
    $('#preview').innerHTML = `<img src="${dataUrl}" alt="Selected product image preview" />`;
  }).catch(error => setStatus(error.message));
}

async function uploadImage() {
  const password = $('#password').value.trim();
  const productId = $('#product').value;
  const color = $('#color').value;
  const file = $('#file').files[0];

  if (!password) return setStatus('Please enter the admin password.');
  if (!file) return setStatus('Please choose an image first.');
  if (!file.type.startsWith('image/')) return setStatus('Please upload an image file.');

  $('#uploadBtn').disabled = true;
  setStatus('Preparing image…');

  try {
    const dataUrl = await readAsDataUrl(file);
    const webpDataUrl = await resizeToWebp(dataUrl);

    setStatus('Uploading to NORÉA website…');
    const response = await fetch('/api/admin/upload-color-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password
      },
      body: JSON.stringify({ productId, color, imageData: webpDataUrl })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed.');

    setStatus(`Uploaded successfully.\n\nSaved as:\n${result.path}\n\nNext: open Render and deploy latest commit. After deploy, customers will see this image when they click ${color}.`);
  } catch (error) {
    setStatus(error.message);
  } finally {
    $('#uploadBtn').disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  $('#file').addEventListener('change', previewFile);
  $('#uploadBtn').addEventListener('click', uploadImage);
});
