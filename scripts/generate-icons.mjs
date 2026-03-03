/**
 * Generate PNG icon assets from SVG sources using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'public', 'icons');

// Ensure output dir exists
mkdirSync(iconsDir, { recursive: true });

const svg512 = readFileSync(resolve(iconsDir, 'icon-512.svg'));
const svg192 = readFileSync(resolve(iconsDir, 'icon-192.svg'));

// Maskable icon needs extra padding (safe zone = inner 80%)
// We render the 512 SVG into a smaller area and add padding
function createMaskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0a0a0f"/>
  <g transform="translate(51.2, 51.2) scale(0.8)">
    ${svg512.toString().replace(/<\?xml[^?]*\?>\s*/g, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
  </g>
</svg>`;
}

// OG image (1200x630) for social sharing
function createOgSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="50%" stop-color="#12121a"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </linearGradient>
    <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
      <feFlood flood-color="#00f5ff" flood-opacity="0.6"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowPurple" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
      <feFlood flood-color="#bf00ff" flood-opacity="0.5"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#bf00ff"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Grid pattern -->
  <g opacity="0.08">
    ${Array.from({length: 38}, (_, i) => `<line x1="${i*32}" y1="0" x2="${i*32}" y2="630" stroke="#00f5ff" stroke-width="0.5"/>`).join('\n    ')}
    ${Array.from({length: 20}, (_, i) => `<line x1="0" y1="${i*32}" x2="1200" y2="${i*32}" stroke="#00f5ff" stroke-width="0.5"/>`).join('\n    ')}
  </g>

  <!-- Corner accents -->
  <path d="M 40 15 L 15 15 L 15 40" fill="none" stroke="#00f5ff" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/>
  <path d="M 1160 15 L 1185 15 L 1185 40" fill="none" stroke="#bf00ff" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/>
  <path d="M 40 615 L 15 615 L 15 590" fill="none" stroke="#bf00ff" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/>
  <path d="M 1160 615 L 1185 615 L 1185 590" fill="none" stroke="#00f5ff" stroke-width="2.5" opacity="0.5" stroke-linecap="round"/>

  <!-- Controller icon -->
  <g transform="translate(600, 200)" filter="url(#glowCyan)">
    <path d="M-100,-35 C-100,-70 -70,-70 -50,-70 L50,-70 C70,-70 100,-70 100,-35 L100,12 C100,30 120,70 95,70 C70,70 56,38 38,38 L-38,38 C-56,38 -70,70 -95,70 C-120,70 -100,30 -100,12 Z"
          fill="none" stroke="#00f5ff" stroke-width="4"/>
    <rect x="-70" y="-28" width="7" height="30" rx="2.5" fill="#00f5ff" opacity="0.9"/>
    <rect x="-81" y="-16" width="30" height="7" rx="2.5" fill="#00f5ff" opacity="0.9"/>
    <circle cx="56" cy="-25" r="7.5" fill="none" stroke="#bf00ff" stroke-width="3" opacity="0.9"/>
    <circle cx="73" cy="-10" r="7.5" fill="none" stroke="#00f5ff" stroke-width="3" opacity="0.9"/>
    <circle cx="40" cy="-10" r="7.5" fill="none" stroke="#39ff14" stroke-width="3" opacity="0.9"/>
    <circle cx="56" cy="5" r="7.5" fill="none" stroke="#ff6b35" stroke-width="3" opacity="0.9"/>
    <circle cx="0" cy="-16" r="5" fill="#00f5ff" opacity="0.6"/>
  </g>

  <!-- GAME text -->
  <text x="600" y="370" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="96" font-weight="900" letter-spacing="16" fill="#00f5ff" filter="url(#glowCyan)">GAME</text>

  <!-- HUB text -->
  <text x="600" y="460" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="96" font-weight="900" letter-spacing="20" fill="#bf00ff" filter="url(#glowPurple)">HUB</text>

  <!-- Tagline -->
  <text x="600" y="520" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="6" fill="#ffffff" opacity="0.5">FREE HTML5 GAMES ON MOBILE</text>

  <!-- Accent line -->
  <line x1="400" y1="540" x2="800" y2="540" stroke="url(#grad)" stroke-width="2" opacity="0.3" stroke-linecap="round"/>

  <!-- Scan lines -->
  <rect x="0" y="210" width="1200" height="1" fill="#00f5ff" opacity="0.05"/>
  <rect x="0" y="400" width="1200" height="1" fill="#bf00ff" opacity="0.04"/>
</svg>`;
}

async function generate() {
  console.log('Generating PNG icons...');

  // icon-192.png
  await sharp(svg192, { density: 300 })
    .resize(192, 192)
    .png()
    .toFile(resolve(iconsDir, 'icon-192.png'));
  console.log('  ✓ icon-192.png');

  // icon-512.png
  await sharp(svg512, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(resolve(iconsDir, 'icon-512.png'));
  console.log('  ✓ icon-512.png');

  // maskable-512.png (with safe-zone padding)
  const maskableSvg = Buffer.from(createMaskableSvg());
  await sharp(maskableSvg, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(resolve(iconsDir, 'maskable-512.png'));
  console.log('  ✓ maskable-512.png');

  // favicon-32.png
  await sharp(svg192, { density: 300 })
    .resize(32, 32)
    .png()
    .toFile(resolve(iconsDir, 'favicon-32.png'));
  console.log('  ✓ favicon-32.png');

  // favicon-16.png
  await sharp(svg192, { density: 300 })
    .resize(16, 16)
    .png()
    .toFile(resolve(iconsDir, 'favicon-16.png'));
  console.log('  ✓ favicon-16.png');

  // apple-touch-icon (180x180)
  await sharp(svg512, { density: 300 })
    .resize(180, 180)
    .png()
    .toFile(resolve(iconsDir, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png');

  // OG image (1200x630)
  const ogSvg = Buffer.from(createOgSvg());
  await sharp(ogSvg, { density: 150 })
    .resize(1200, 630)
    .png({ quality: 90 })
    .toFile(resolve(iconsDir, '..', 'og-image.png'));
  console.log('  ✓ og-image.png');

  console.log('\nAll icons generated successfully!');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
