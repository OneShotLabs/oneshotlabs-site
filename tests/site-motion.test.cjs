const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = ['index.html', 'contact.html', 'career.html', 'bio.html', 'musings.html', 'post.html'];

for (const page of pages) {
  const html = read(page);
  assert.match(html, /css\/site-motion\.css\?v=20260913-review2/, `${page} loads the local motion stylesheet`);
  assert.match(html, /js\/site-motion\.js\?v=20260913-review2/, `${page} loads the local motion controller`);
}

const photography = read('photography.html');
assert.doesNotMatch(photography, /css\/site-motion\.css/, 'photography keeps its original gallery motion without the shared section reveal');
assert.doesNotMatch(photography, /js\/site-motion\.js/, 'photography does not load the shared section reveal controller');
assert.match(photography, /js\/photography\.js/, 'photography retains its original per-photo reveal behavior');

const ai = read('ai-consulting.html');
assert.match(ai, /js\/navy-veil\.js\?v=20260914-cinema2/, 'AI page loads its approved Gold Seam entry motion');
assert.match(ai, /css\/fabric-finish\.css\?v=20260914-merged1/, 'AI page loads the fabric motion system');
assert.match(ai, /js\/fabric-results-globe\.js\?v=20260914-merged1/, 'AI page loads the interactive globe');
assert.match(ai, /js\/fabric-questionnaire\.js\?v=20260914-merged1/, 'AI page loads the assessment handoff');

const css = read('css/site-motion.css');
assert.match(css, /\.ai-page \.instrument/, 'AI evidence choreography is present');
assert.match(css, /\.timeline-item\.is-visible \.timeline-photo/, 'photography settling is present');
assert.match(css, /\.contact-block::before/, 'contact closing rule is present');
assert.match(css, /@media \(max-width: 720px\)/, 'mobile-specific motion is present');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'reduced-motion direction is present');

const js = read('js/site-motion.js');
assert.match(js, /const isHome/, 'homepage motion is protected from interior-page reveals');
assert.doesNotMatch(js, /is-page-leaving|site-motion-curtain/, 'page navigation is immediate with no decorative wipe');
assert.match(js, /IntersectionObserver/, 'offscreen work is event-driven');

console.log('PASS: dedicated AI motion and shared site motion cover the merged experience.');
