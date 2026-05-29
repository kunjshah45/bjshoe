// Post-build: inject the Google AdSense loader script into every exported
// HTML page, plus one in-article ad placement on the static content pages.
// Auto Ads (enabled in the AdSense dashboard) handles additional placements
// automatically — these manual <ins> blocks just guarantee one high-value
// placement on long-form pages where Auto Ads is conservative.

const fs = require('fs');
const path = require('path');

const PUBLISHER_ID = 'ca-pub-1675923800122600';
const PUB_NUMERIC = PUBLISHER_ID.replace(/^ca-/, '');
const ADS_TXT_TOKEN = 'f08c47fec0942fa0';

// Content-page in-content placement. Reuses the ad3 (horizontal) Display
// unit — rendered as a responsive display ad, which fits well between
// paragraphs on long-form pages.
const CONTENT_PAGE_SLOT = '6453477290';

const SCRIPT = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}" crossorigin="anonymous"></script>`;
const META = `<meta name="google-adsense-account" content="${PUBLISHER_ID}">`;

// In-content ad block. Responsive display ad — adapts to the page width and
// flows naturally between paragraphs. The marker comment is used below for
// idempotency (don't double-inject on re-runs).
const INARTICLE_MARKER = 'bjshoe-incontent-ad';
const INARTICLE_AD = `
<div style="margin: 24px 0; text-align: center;"><!-- ${INARTICLE_MARKER} -->
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="${PUBLISHER_ID}"
       data-ad-slot="${CONTENT_PAGE_SLOT}"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;

const distDir = path.join(__dirname, '..', 'dist');

function walkHtmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Static content pages where we want one manual in-article ad. Each is a
// folder name under client/public/ that gets copied to dist/<name>/index.html.
const CONTENT_PAGES = new Set([
  'card-counting/index.html',
  'blackjack-strategy/index.html',
  'blackjack-rules/index.html',
  'blackjack-odds/index.html',
  'blackjack-glossary/index.html',
]);

for (const filePath of walkHtmlFiles(distDir)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('</head>')) continue; // GSC verification etc.
  let changed = false;
  const rel = path.relative(distDir, filePath).replace(/\\/g, '/');

  // Loader script + ownership meta on every page.
  if (!html.includes(`client=${PUBLISHER_ID}`)) {
    html = html.replace('</head>', `${SCRIPT}</head>`);
    changed = true;
  }
  if (!html.includes('google-adsense-account')) {
    html = html.replace('</head>', `${META}</head>`);
    changed = true;
  }

  // In-content ad after the FIRST <h2> on content pages.
  if (CONTENT_PAGES.has(rel) && !html.includes(INARTICLE_MARKER)) {
    // Match the first </h2> and insert the ad block right after it.
    const replaced = html.replace(/<\/h2>/, `</h2>${INARTICLE_AD}`);
    if (replaced !== html) {
      html = replaced;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    console.log(`Injected AdSense into ${rel}`);
  }
}

// Write ads.txt — authorizes Google to sell ad inventory on this domain.
const adsTxt = `google.com, ${PUB_NUMERIC}, DIRECT, ${ADS_TXT_TOKEN}\n`;
fs.writeFileSync(path.join(distDir, 'ads.txt'), adsTxt);
console.log('Wrote dist/ads.txt');
