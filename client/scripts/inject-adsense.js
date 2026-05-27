// Post-build: inject the Google AdSense loader script into the exported
// index.html / 404.html. Auto Ads (enabled in the AdSense dashboard) then
// places ads automatically; we don't need any <ins> placements in the app.

const fs = require('fs');
const path = require('path');

const PUBLISHER_ID = 'ca-pub-1675923800122600';
const SCRIPT = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}" crossorigin="anonymous"></script>`;

const distDir = path.join(__dirname, '..', 'dist');

for (const file of ['index.html', '404.html']) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(PUBLISHER_ID)) {
    console.log(`AdSense already present in ${file}, skipping`);
    continue;
  }

  const updated = html.replace('</head>', `${SCRIPT}</head>`);
  fs.writeFileSync(filePath, updated);
  console.log(`Injected AdSense into ${file}`);
}
