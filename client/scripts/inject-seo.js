// Post-build: inject SEO meta tags + structured data + noscript content into
// the exported HTML, and write robots.txt + sitemap.xml. Runs separately from
// inject-adsense.js so each script has one job.

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bjshoe.app';
const TITLE = 'Blackjack — Play Free Online Blackjack | bjshoe';
const DESCRIPTION = 'Play free online blackjack against the dealer. No signup, no download, classic Vegas rules — splits, doubles, late surrender, insurance, and 3:2 blackjack payouts. Free chips, instant play.';
const KEYWORDS = 'blackjack, free blackjack, online blackjack, blackjack online, blackjack free, play blackjack, blackjack game, vegas blackjack, 21';
const OG_IMAGE = `${SITE_URL}/icon.png`;

const SEO_HEAD = `
  <meta name="description" content="${DESCRIPTION}">
  <meta name="keywords" content="${KEYWORDS}">
  <link rel="canonical" href="${SITE_URL}/">
  <meta name="theme-color" content="#0f172a">
  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${DESCRIPTION}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:site_name" content="bjshoe">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="${DESCRIPTION}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Blackjack — bjshoe',
    description: DESCRIPTION,
    url: SITE_URL,
    image: OG_IMAGE,
    genre: 'Casino Card Game',
    gamePlatform: 'Web Browser',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  })}</script>
`;

const NOSCRIPT_CONTENT = `
  <noscript>
    <div style="font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 20px; color: #f8fafc; background: #0f172a;">
      <h1>Free Online Blackjack — Play in Your Browser</h1>
      <p>bjshoe is a free online blackjack game playable directly in your browser — no signup, no download, no installation. Test your skills against the dealer with classic Vegas-style rules including splits, doubles, late surrender, and insurance.</p>
      <h2>How to Play Blackjack</h2>
      <p>The goal is to get a hand value closer to 21 than the dealer without going over. Number cards count their face value, face cards (J, Q, K) are worth 10, and Aces are 1 or 11. After your initial two cards you can hit (take another card), stand (keep your hand), double (double your bet and take exactly one more card), split (if your two cards match), or surrender (forfeit half your bet for an early exit).</p>
      <h2>Blackjack Payouts</h2>
      <p>A natural blackjack — an Ace plus a 10-value card on your first two cards — pays 3:2. Regular wins pay 1:1. A push (tie with the dealer) returns your bet. Insurance is offered when the dealer shows an Ace and pays 2:1 if the dealer has blackjack.</p>
      <h2>About bjshoe</h2>
      <p>bjshoe is a free, no-account online blackjack game. Start with 1000 chips, claim more for free anytime you run out. Designed to feel like a real casino table with proper deal animations and casino-standard rules.</p>
      <p><strong>Enable JavaScript in your browser to start playing.</strong></p>
    </div>
  </noscript>
`;

const distDir = path.join(__dirname, '..', 'dist');

// Replace title + inject SEO head + inject noscript content
for (const file of ['index.html', '404.html']) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // <html lang="en"> for accessibility + SEO
  if (!/<html[^>]*\blang=/.test(html)) {
    html = html.replace('<html', '<html lang="en"');
    changed = true;
  }

  // Replace whatever <title> Expo emitted with our SEO title
  if (!html.includes(TITLE)) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
    changed = true;
  }

  // Inject the SEO head block once, just before </head>
  if (!html.includes('property="og:title"')) {
    html = html.replace('</head>', `${SEO_HEAD}</head>`);
    changed = true;
  }

  // Inject crawler-friendly noscript content once, right after <body>
  if (!html.includes('Free Online Blackjack — Play in Your Browser')) {
    html = html.replace(/<body([^>]*)>/, `<body$1>${NOSCRIPT_CONTENT}`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    console.log(`Injected SEO into ${file}`);
  } else {
    console.log(`${file} already has SEO content`);
  }
}

// robots.txt — allow all crawlers, point to sitemap
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
console.log('Wrote dist/robots.txt');

// sitemap.xml — single-page site for now
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log('Wrote dist/sitemap.xml');
