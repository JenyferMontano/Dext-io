/**
 * Genera iconos PNG para la PWA (color sólido de marca).
 */
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

function writeIcon(size, filename) {
  const png = new PNG({ width: size, height: size });
  const r = 37;
  const g = 99;
  const b = 235;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return new Promise((resolve, reject) => {
    png
      .pack()
      .pipe(fs.createWriteStream(path.join(iconsDir, filename)))
      .on('finish', resolve)
      .on('error', reject);
  });
}

function writePlaceholderNoImage() {
  const w = 640;
  const h = 360;
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (w * y + x) << 2;
      const g = 180;
      png.data[idx] = g;
      png.data[idx + 1] = g;
      png.data[idx + 2] = g;
      png.data[idx + 3] = 255;
    }
  }
  const out = path.join(__dirname, '..', 'public', 'no-image.png');
  return new Promise((resolve, reject) => {
    png
      .pack()
      .pipe(fs.createWriteStream(out))
      .on('finish', resolve)
      .on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  await writeIcon(192, 'icon-192.png');
  await writeIcon(512, 'icon-512.png');
  await writePlaceholderNoImage();
  console.log('[icons] Generados icon-192.png, icon-512.png, no-image.png');
}

main().catch((err) => {
  console.warn('[icons] Omitido o error:', err.message);
  process.exit(0);
});
