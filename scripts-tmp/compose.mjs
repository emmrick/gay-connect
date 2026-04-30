import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs';

const BASE = 'src/assets/marketing/gay-social-flyer-base.png';
const OUT_PROJECT = 'src/assets/marketing/gay-social-flyer.png';
const OUT_DOC = '/mnt/documents/gay-social-flyer.png';

// Crop the base flyer to remove the bottom CTA + footer area (we'll rebuild it cleanly)
// We keep everything from y=0 down to just below the 3 feature cards (~y=1240).
const CROP_BOTTOM = 1240;
const cropped = await sharp(BASE).extract({ left: 0, top: 0, width: 1024, height: CROP_BOTTOM }).png().toBuffer();

// New bottom band that hosts the CTA button + QR code side by side
const BAND_H = 360;
const W = 1024;
const H = CROP_BOTTOM + BAND_H;

// Generate the real QR
const qrSize = 200;
const qrPng = await QRCode.toBuffer('https://gaysocial.fr', {
  errorCorrectionLevel: 'H',
  margin: 0,
  width: qrSize,
  color: { dark: '#1a0b2e', light: '#FFFFFF' },
});

// Build the full bottom band as a single SVG: background continuation + CTA pill + QR card slot + url + legal
const bandSvg = Buffer.from(`
<svg width="${W}" height="${BAND_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a0b2e"/>
      <stop offset="1" stop-color="#0d0418"/>
    </linearGradient>
    <linearGradient id="cta" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#EC4899"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="urlGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#EC4899"/>
      <stop offset="1" stop-color="#A855F7"/>
    </linearGradient>
    <filter id="ctaShadow" x="-10%" y="-50%" width="120%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="8"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect x="0" y="0" width="${W}" height="${BAND_H}" fill="url(#bg)"/>

  <!-- CTA pill button (left) -->
  <g filter="url(#ctaShadow)">
    <rect x="50" y="40" width="640" height="92" rx="46" ry="46" fill="url(#cta)"/>
  </g>
  <text x="370" y="98" text-anchor="middle"
        font-family="Helvetica, Arial Black, sans-serif" font-weight="900" font-size="34" fill="white" letter-spacing="1">
    S'INSCRIRE GRATUITEMENT  →
  </text>

  <!-- QR card (right) -->
  <g filter="url(#cardShadow)">
    <rect x="740" y="20" width="234" height="232" rx="22" ry="22" fill="white"/>
    <rect x="740" y="220" width="234" height="32" fill="url(#cta)"/>
  </g>
  <text x="857" y="243" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="14" fill="white" letter-spacing="3">
    SCANNE-MOI
  </text>

  <!-- gaysocial.fr url (centered below CTA) -->
  <text x="370" y="200" text-anchor="middle"
        font-family="Helvetica, Arial Black, sans-serif" font-weight="900" font-size="48" fill="url(#urlGrad)" letter-spacing="1">
    gaysocial.fr
  </text>

  <!-- Legal footer -->
  <text x="${W / 2}" y="${BAND_H - 30}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="500" font-size="16" fill="#FFFFFFCC" letter-spacing="0.5">
    Réservé aux adultes +18 ans  •  Hommes uniquement  •  Inscription gratuite
  </text>
  <circle cx="${W / 2 - 245}" cy="${BAND_H - 35}" r="3" fill="#EC4899"/>
  <circle cx="${W / 2 + 30}" cy="${BAND_H - 35}" r="3" fill="#EC4899"/>
</svg>
`);

// Compose: cropped flyer top + new band, with QR PNG placed on the white card area
const QR_LEFT_IN_BAND = 740 + (234 - qrSize) / 2;
const QR_TOP_IN_BAND  = 20  + (200 - qrSize) / 2 + 5;

await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 13, g: 4, b: 24, alpha: 1 } },
})
  .composite([
    { input: cropped, left: 0, top: 0 },
    { input: bandSvg, left: 0, top: CROP_BOTTOM },
    { input: qrPng, left: Math.round(QR_LEFT_IN_BAND), top: CROP_BOTTOM + Math.round(QR_TOP_IN_BAND) },
  ])
  .png()
  .toFile(OUT_PROJECT);

fs.copyFileSync(OUT_PROJECT, OUT_DOC);
console.log('Final', W, 'x', H, '->', OUT_DOC);
