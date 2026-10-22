const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const favicon = fs.readFileSync(path.join(root, 'favicon.svg'), 'utf8');

assert.match(home, /rel="canonical" href="https:\/\/oneshotlens\.com\/"/);
assert.match(home, /property="og:image" content="https:\/\/oneshotlens\.com\/assets\/brand\/oneshotlens-social-card\.png"/);
assert.match(home, /property="og:image:width" content="1200"/);
assert.match(home, /property="og:image:height" content="630"/);
assert.match(home, /name="twitter:card" content="summary_large_image"/);
assert.match(home, /rel="apple-touch-icon" href="\/apple-touch-icon\.png" sizes="180x180"/);

for (const asset of [
  'assets/brand/oneshotlens-social-card.png',
  'favicon.svg',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'favicon.ico',
  'apple-touch-icon.png',
]) {
  assert.ok(fs.existsSync(path.join(root, asset)), `${asset} must exist`);
}

assert.match(favicon, /id="favicon-blade"/);
assert.match(favicon, /id="favicon-corner"/);

for (const page of [
  '404.html',
  'ai.html',
  'bio.html',
  'career.html',
  'contact.html',
  'index.html',
  'musings.html',
  'photography.html',
  'post.html',
  'musings/ai-has-a-branding-problem/index.html',
  'musings/the-intelligence-inside-your-business/index.html',
]) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.match(html, /href="\/favicon\.svg"/, `${page} must use the root favicon`);
}

console.log('PASS: homepage social preview and browser icon assets are wired.');
