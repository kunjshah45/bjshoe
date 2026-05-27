// Post-build: inject the Google AdSense loader script into the exported
// index.html / 404.html. Auto Ads (enabled in the AdSense dashboard) then
// places ads automatically; we don't need any <ins> placements in the app.

const fs = require('fs');
const path = require('path');

const PUBLISHER_ID = 'ca-pub-1675923800122600';
const PUB_NUMERIC = PUBLISHER_ID.replace(/^ca-/, '');
const ADS_TXT_TOKEN = 'f08c47fec0942fa0';

const SCRIPT = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}" crossorigin="anonymous"></script>`;
const META = `<meta name="google-adsense-account" content="${PUBLISHER_ID}">`;

const distDir = path.join(__dirname, '..', 'dist');

// Inject loader script + ownership meta tag into HTML files.
for (const file of ['index.html', '404.html']) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (!html.includes(`client=${PUBLISHER_ID}`)) {
    html = html.replace('</head>', `${SCRIPT}</head>`);
    changed = true;
  }
  if (!html.includes('google-adsense-account')) {
    html = html.replace('</head>', `${META}</head>`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    console.log(`Injected AdSense tags into ${file}`);
  } else {
    console.log(`${file} already has AdSense tags`);
  }
}

// Write ads.txt — authorizes Google to sell ad inventory on this domain.
const adsTxt = `google.com, ${PUB_NUMERIC}, DIRECT, ${ADS_TXT_TOKEN}\n`;
fs.writeFileSync(path.join(distDir, 'ads.txt'), adsTxt);
console.log('Wrote dist/ads.txt');
