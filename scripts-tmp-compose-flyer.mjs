import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs';

const FLYER = 'src/assets/marketing/gay-social-flyer.png';
const OUT = '/mnt/documents/gay-social-flyer.png';
const OUT_PROJECT = 'src/assets/marketing/gay-social-flyer-final.png';

// Get base flyer dimensions
const meta = await sharp(FLYER).metadata();
console.log('Flyer:', meta.width, 'x', meta.height);

// Generate a real QR code -> https://gaysocial.fr
// High error correction so it stays scannable even with the white card around it
const qrSize = Math.round(meta.width * 0.18); // ~18% of flyer width
const qrPng = await QRCode.toBuffer('https://gaysocial.fr', {
  errorCorrectionLevel: 'H',
  margin: 1,
  width: qrSize,
  color: { dark: '#000000', light: '#FFFFFF' },
});

// Position over the existing decorative QR area (bottom-right)
// Original QR roughly at right edge, near the CTA button
const left = meta.width - qrSize - Math.round(meta.width * 0.06);
const top  = Math.round(meta.height * 0.835);

// Add a white rounded background slightly larger to fully mask the fake QR
const pad = 14;
const bgSize = qrSize + pad * 2;
const bgSvg = Buffer.from(
  `<svg width="${bgSize}" height="${bgSize}" xmlns="http://www.w3.org/2000/svg">
     <rect x="0" y="0" width="${bgSize}" height="${bgSize}" rx="18" ry="18" fill="white"/>
   </svg>`
);

await sharp(FLYER)
  .composite([
    { input: bgSvg, left: left - pad, top: top - pad },
    { input: qrPng, left, top },
  ])
  .png()
  .toFile(OUT_PROJECT);

fs.copyFileSync(OUT_PROJECT, OUT);
console.log('Done ->', OUT);
