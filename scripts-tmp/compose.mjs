import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs';

const BASE = 'src/assets/marketing/gay-social-flyer-base.png';
const OUT_PROJECT = 'src/assets/marketing/gay-social-flyer.png';
const OUT_DOC = '/mnt/documents/gay-social-flyer.png';

const meta = await sharp(BASE).metadata();
const W = meta.width, H = meta.height;

// Compact card sized to fit alongside the CTA button (right of it)
const qrSize = 150;
const padInner = 12;
const cardW = qrSize + padInner * 2;
const labelH = 28;
const cardH = qrSize + padInner * 2 + labelH;

const qrPng = await QRCode.toBuffer('https://gaysocial.fr', {
  errorCorrectionLevel: 'H',
  margin: 0,
  width: qrSize,
  color: { dark: '#1a0b2e', light: '#FFFFFF' },
});

const cardSvg = Buffer.from(`
<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
      <feOffset dx="0" dy="3" result="offsetblur"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="lbl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#EC4899"/>
      <stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="${cardW - 4}" height="${cardH - 4}" rx="18" ry="18" fill="white" filter="url(#shadow)"/>
  <rect x="0" y="${cardH - labelH}" width="${cardW}" height="${labelH}" fill="url(#lbl)"/>
  <text x="${cardW / 2}" y="${cardH - labelH / 2 + 5}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="13" fill="white" letter-spacing="2">
    SCANNE-MOI
  </text>
</svg>`);

// Place the QR card to the RIGHT of the CTA button (same vertical band).
// The CTA button in the base image sits roughly at y = 1305..1400.
// We'll align the card's vertical center with the button's center.
const buttonCenterY = 1352;
const top  = Math.round(buttonCenterY - cardH / 2);
const left = W - cardW - 38;

await sharp(BASE)
  .composite([
    { input: cardSvg, left, top },
    { input: qrPng,   left: left + padInner, top: top + padInner },
  ])
  .png()
  .toFile(OUT_PROJECT);

fs.copyFileSync(OUT_PROJECT, OUT_DOC);
console.log('Card:', cardW, 'x', cardH, 'at', left, top);
