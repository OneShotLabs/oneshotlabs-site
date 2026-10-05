const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const pages = {
  'index.html': ['https://oneshotlens.com/', 'assets/brand/oneshotlens-social-card.png'],
  'ai.html': ['https://oneshotlens.com/ai', 'assets/brand/oneshotlens-social-card.png'],
  'career.html': ['https://oneshotlens.com/career', 'assets/brand/oneshotlens-social-card.png'],
  'photography.html': ['https://oneshotlens.com/photography', 'assets/brand/oneshotlens-social-card.png'],
  'musings.html': ['https://oneshotlens.com/musings', 'assets/brand/oneshotlens-social-card.png'],
  'bio.html': ['https://oneshotlens.com/bio', 'assets/brand/oneshotlens-social-card.png'],
  'contact.html': ['https://oneshotlens.com/contact', 'assets/brand/oneshotlens-social-card.png'],
};

for (const [file, [canonical, image]] of Object.entries(pages)) {
  const html = read(file);
  assert.match(html, /<title>[^<]{12,}<\/title>/, `${file} needs a descriptive title`);
  assert.match(html, /<meta name="description" content="[^"\n]{40,}"\s*\/?\s*>/, `${file} needs a useful description`);
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${file} needs its canonical URL`);
  assert.ok(html.includes(`property="og:image" content="https://oneshotlens.com/${image}"`), `${file} needs its share image`);
  assert.match(html, /name="twitter:card" content="summary_large_image"/, `${file} needs a large social card`);
  assert.match(html, /js\/analytics\.js\?v=20260928/, `${file} needs privacy-first analytics`);
  assert.ok(fs.existsSync(path.join(root, image)), `${image} must exist`);
}

const draftShareCardPattern = /assets\/brand\/social-(?:ai|career|photography|musings|bio)\.png/;
for (const file of Object.keys(pages)) {
  assert.doesNotMatch(read(file), draftShareCardPattern, `${file} must not publish an unapproved draft share card`);
}

const contact = read('contact.html');
assert.match(contact, /name="contact"[^>]+method="POST"[^>]+data-netlify="true"[^>]+netlify-honeypot="bot-field"/);
assert.match(contact, /name="form-name" value="contact"/);
assert.match(contact, /name="utm_source"/);
assert.match(read('js/main.js'), /Content-Type": "application\/x-www-form-urlencoded"/);

const home = read('index.html');
assert.match(home, /<title>Applied AI for Commercial Real Estate \| OneShotLens<\/title>/);
assert.match(home, /name="description" content="OneShotLens explores applied AI, commercial real estate finance, photography and the ideas shaping what comes next\."/);
assert.match(home, /property="og:title" content="Intelligence for What’s Next"/);
assert.match(home, /name="twitter:title" content="Intelligence for What’s Next"/);

const analyticsClient = read('js/analytics.js');
assert.doesNotMatch(analyticsClient, /localStorage|document\.cookie|userAgent|fingerprint/i);
assert.match(analyticsClient, /window\.oslTrack = track/);
assert.match(read('netlify/functions/analytics-events.mjs'), /getStore\(\{ name: "oneshotlens-analytics" \}\)/);
assert.doesNotMatch(read('netlify/functions/analytics-events.mjs'), /context\.ip|user-agent|cookie/i);

for (const file of ['index.html', 'bio.html', 'musings/ai-has-a-branding-problem/index.html']) {
  const blocks = [...read(file).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length, `${file} needs JSON-LD`);
  blocks.forEach((block) => JSON.parse(block[1]));
}

const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
assert.match(robots, /Sitemap: https:\/\/oneshotlens\.com\/sitemap\.xml/);
for (const canonical of Object.values(pages).map(([url]) => url)) {
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `sitemap must include ${canonical}`);
}
assert.ok(sitemap.includes('<loc>https://oneshotlens.com/musings/ai-has-a-branding-problem</loc>'));

console.log('PASS: contact, analytics, sharing, structured data, discovery and SEO metadata are wired.');
