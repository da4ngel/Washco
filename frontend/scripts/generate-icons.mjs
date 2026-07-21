// One-off script: rasterizes public/favicon.svg into the PWA icon set.
// Run manually with `node scripts/generate-icons.mjs` whenever the source mark changes.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
mkdirSync(iconsDir, { recursive: true });

const MARK = `
  <path d="M8 20c0-3 2-5 4-8 1.4 2 2 3 2 4.5A2 2 0 0 1 12 18.5 2 2 0 0 1 10 16.5" fill="none" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
  <circle cx="20" cy="18" r="4.5" fill="none" stroke="#4ADE80" stroke-width="2"/>
`;

// Standard icon: matches favicon.svg (rounded square, full-bleed mark).
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0F2167"/>
  ${MARK}
</svg>`;

// Maskable icon: no corner rounding (OS applies its own mask) and the mark
// scaled down ~70% so it stays inside the ~80%-diameter safe zone.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0F2167"/>
  <g transform="translate(16 16) scale(0.7) translate(-16 -16)">
    ${MARK}
  </g>
</svg>`;

const targets = [
  { svg: standardSvg, size: 192, out: 'icon-192.png' },
  { svg: standardSvg, size: 512, out: 'icon-512.png' },
  { svg: maskableSvg, size: 192, out: 'icon-maskable-192.png' },
  { svg: maskableSvg, size: 512, out: 'icon-maskable-512.png' },
  { svg: standardSvg, size: 180, out: 'apple-touch-icon.png' },
];

for (const { svg, size, out } of targets) {
  const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(path.join(iconsDir, out), buffer);
  console.log(`wrote public/icons/${out} (${size}x${size})`);
}
