const sharp = require('sharp');
const fs    = require('fs');

// SVG del ícono GAMS TI
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#6c63ff"/>
  <rect x="80"  y="140" width="352" height="220" rx="20" fill="none" stroke="white" stroke-width="24"/>
  <rect x="190" y="360" width="132" height="24"  rx="6"  fill="white"/>
  <rect x="156" y="384" width="200" height="16"  rx="6"  fill="white"/>
  <circle cx="256" cy="250" r="50" fill="none" stroke="white" stroke-width="20"/>
  <line x1="256" y1="200" x2="256" y2="160" stroke="white" stroke-width="16" stroke-linecap="round"/>
  <line x1="256" y1="300" x2="256" y2="340" stroke="white" stroke-width="16" stroke-linecap="round"/>
  <line x1="206" y1="250" x2="166" y2="250" stroke="white" stroke-width="16" stroke-linecap="round"/>
  <line x1="306" y1="250" x2="346" y2="250" stroke="white" stroke-width="16" stroke-linecap="round"/>
</svg>`;

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/icon.svg', svg);

sharp(Buffer.from(svg))
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png', (err) => {
    if (err) console.error('Error 192:', err);
    else console.log('✅ icon-192.png creado');
  });

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png', (err) => {
    if (err) console.error('Error 512:', err);
    else console.log('✅ icon-512.png creado');
  });