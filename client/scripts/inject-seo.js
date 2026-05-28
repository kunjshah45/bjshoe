// Post-build: inject SEO meta tags + structured data + noscript content into
// the exported HTML, and write robots.txt + sitemap.xml. Runs separately from
// inject-adsense.js so each script has one job.

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bjshoe.app';
const TITLE = 'Blackjack — Play Free Online Blackjack | bjshoe';
const DESCRIPTION = 'Play free online blackjack against the dealer. No signup, no download, classic Vegas rules — splits, doubles, late surrender, insurance, and 3:2 blackjack payouts. Free chips, instant play.';
const KEYWORDS = 'blackjack, free blackjack, online blackjack, blackjack online, blackjack free, play blackjack, blackjack game, vegas blackjack, 21, blackjack rules, blackjack strategy, free blackjack no download';
const OG_IMAGE = `${SITE_URL}/icon.png`;

// Structured data — multiple types so Google has more signals to work with.
const SCHEMA_VIDEOGAME = {
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.7',
    ratingCount: '1',
    bestRating: '5',
  },
};

// WebSite schema — eligible for sitelinks searchbox in Google results.
const SCHEMA_WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'bjshoe',
  alternateName: 'Bjshoe Blackjack',
  url: SITE_URL,
  description: DESCRIPTION,
};

// Organization schema — establishes a publisher identity.
const SCHEMA_ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'bjshoe',
  url: SITE_URL,
  logo: OG_IMAGE,
};

// FAQPage schema — Google can show these Q&As directly in search results
// as a rich snippet (massive CTR boost when it lands).
const SCHEMA_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is bjshoe free to play?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. bjshoe is completely free — no account, no signup, no download. You start with 1,000 virtual chips and can claim more for free anytime you run out.' },
    },
    {
      '@type': 'Question',
      name: 'Do I need to download anything to play blackjack on bjshoe?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. bjshoe runs entirely in your browser. Open the site and play instantly on desktop or mobile — there is nothing to install.' },
    },
    {
      '@type': 'Question',
      name: 'What blackjack rules does bjshoe use?',
      acceptedAnswer: { '@type': 'Answer', text: 'Classic Vegas-style rules: 3:2 blackjack payouts, splits and doubles allowed, late surrender, and insurance offered when the dealer shows an Ace. You can configure deck count (2 to 10), whether the dealer hits soft 17, and whether insurance is offered.' },
    },
    {
      '@type': 'Question',
      name: 'Can I play blackjack with friends?',
      acceptedAnswer: { '@type': 'Answer', text: 'Multiplayer mode is in development. Solo play vs. the dealer is fully available today, with multiplayer rooms (up to 7 players) coming back online soon.' },
    },
    {
      '@type': 'Question',
      name: 'Is the shuffle fair on bjshoe?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. The shoe is shuffled with a Fisher-Yates algorithm using the browser\'s cryptographic random source. In solo mode the shoe lives in your own browser; in multiplayer it runs on the authoritative server.' },
    },
    {
      '@type': 'Question',
      name: 'Can I count cards on bjshoe?',
      acceptedAnswer: { '@type': 'Answer', text: 'The shoe reshuffles after each round in solo mode, so card counting will not give you a meaningful edge here by design. If you want to learn the Hi-Lo system, see our full guide at bjshoe.app/card-counting/.' },
    },
    {
      '@type': 'Question',
      name: 'What happens when I run out of chips?',
      acceptedAnswer: { '@type': 'Answer', text: 'A "Claim 1,000 free chips" button appears. There is no cooldown, no ads to watch, no signup — just click to refill and keep playing.' },
    },
  ],
};

const SEO_HEAD = `
  <meta name="description" content="${DESCRIPTION}">
  <meta name="keywords" content="${KEYWORDS}">
  <link rel="canonical" href="${SITE_URL}/">
  <meta name="theme-color" content="#0f172a">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${DESCRIPTION}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:site_name" content="bjshoe">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="${DESCRIPTION}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <script type="application/ld+json">${JSON.stringify(SCHEMA_VIDEOGAME)}</script>
  <script type="application/ld+json">${JSON.stringify(SCHEMA_WEBSITE)}</script>
  <script type="application/ld+json">${JSON.stringify(SCHEMA_ORG)}</script>
  <script type="application/ld+json">${JSON.stringify(SCHEMA_FAQ)}</script>
`;

// Greatly expanded noscript block. Crawlers index this; users only see it
// if JS is disabled. The bulk of indexable on-page text for the home URL
// lives here.
const NOSCRIPT_CONTENT = `
  <noscript>
    <div style="font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 20px; color: #f8fafc; background: #0f172a; line-height: 1.6;">
      <h1>Free Online Blackjack — Play in Your Browser</h1>
      <p><strong>bjshoe</strong> is a free, browser-based blackjack game. No signup, no downloads, no real money. Start with 1,000 virtual chips and play against the dealer with classic Vegas rules — splits, doubles, late surrender, insurance, and 3:2 blackjack payouts.</p>

      <h2>How to play blackjack</h2>
      <p>The objective is to get a hand value closer to 21 than the dealer without going over. Number cards (2 through 10) count their face value. Face cards — Jack, Queen, King — are worth 10. The Ace is worth either 1 or 11, whichever helps your hand more (this is called a "soft" total when the Ace is 11).</p>
      <p>Each round you place a bet, the dealer deals two cards to you face up and two to themselves (one face up, one face down). You then choose an action:</p>
      <ul>
        <li><strong>Hit</strong> — take another card. Repeat until you stand or bust (exceed 21).</li>
        <li><strong>Stand</strong> — keep your current hand and end your turn.</li>
        <li><strong>Double down</strong> — double your bet and take exactly one more card. Only allowed on your first two cards.</li>
        <li><strong>Split</strong> — if your two starting cards have the same value, split them into two separate hands, with a matching bet on the new hand.</li>
        <li><strong>Surrender</strong> — give up the hand and get half your bet back. Only available on your first two cards.</li>
      </ul>
      <p>Once you've decided, the dealer reveals their hole card and draws until reaching 17 or higher. Hands are compared and payouts settled automatically.</p>

      <h2>Blackjack payouts</h2>
      <p>Knowing the payout schedule is half of basic strategy:</p>
      <ul>
        <li><strong>Natural blackjack</strong> (Ace + 10-value card on your first two cards) pays <strong>3:2</strong> — bet $10, win $15.</li>
        <li><strong>Regular win</strong> pays <strong>1:1</strong> (even money).</li>
        <li><strong>Push</strong> (you and the dealer tie) returns your bet.</li>
        <li><strong>Loss</strong> — you lose the bet.</li>
        <li><strong>Insurance</strong> — offered only when the dealer's up-card is an Ace; pays 2:1 if the dealer has blackjack.</li>
      </ul>

      <h2>Why play blackjack online?</h2>
      <p>Blackjack is unique among casino games because skilled play meaningfully changes your expected outcome. With perfect basic strategy alone, the house edge drops to under 0.5% — better than virtually any other casino game. bjshoe lets you practice that strategy freely, without risking real money or signing up for an account.</p>

      <h2>What makes bjshoe different</h2>
      <ul>
        <li><strong>Genuinely free</strong> — virtual chips with no real-world value. No upsell, no premium tier.</li>
        <li><strong>Instant play</strong> — opens in a tab. No login walls.</li>
        <li><strong>Real-casino feel</strong> — proper deal animations, hole-card flips, card sweeps to the discard pile, win/lose sound effects.</li>
        <li><strong>Configurable rules</strong> — 2 to 10 decks, dealer hits or stands on soft 17, insurance on or off.</li>
        <li><strong>Free chip refill</strong> — one click to get 1,000 more chips when you run out.</li>
      </ul>

      <h2>Common blackjack terms</h2>
      <p>
        <strong>Shoe:</strong> the multi-deck stack of cards the dealer deals from.
        <strong>Hole card:</strong> the dealer's face-down card.
        <strong>Soft hand:</strong> a hand containing an Ace counted as 11 (cannot bust on the next hit).
        <strong>Hard hand:</strong> a hand with no Ace, or an Ace forced to count as 1.
        <strong>Bust:</strong> hand value exceeds 21 — automatic loss.
        <strong>Push:</strong> a tie with the dealer; bet returned.
        <strong>Natural / blackjack:</strong> Ace plus 10-value card on the first two cards, paying 3:2.
        <strong>Stiff hand:</strong> a hard total of 12–16 — likely to bust if hit, likely to lose if stood.
      </p>

      <h2>About bjshoe</h2>
      <p>bjshoe is an independent free blackjack game. It is not affiliated with any real-money casino and does not facilitate real-money gambling. Chips are virtual and cannot be purchased, sold, or redeemed. For more on data handling see our <a href="/privacy/">Privacy Policy</a>; for usage terms see <a href="/terms/">Terms of Use</a>; for the deep dive on card counting see our <a href="/card-counting/">Card Counting Guide</a>.</p>

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

// sitemap.xml — every indexable URL
const sitemapUrls = [
  { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${SITE_URL}/card-counting/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/blackjack-strategy/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/blackjack-rules/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/blackjack-odds/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE_URL}/blackjack-glossary/`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE_URL}/privacy/`, changefreq: 'yearly', priority: '0.3' },
  { loc: `${SITE_URL}/terms/`, changefreq: 'yearly', priority: '0.3' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log('Wrote dist/sitemap.xml');
