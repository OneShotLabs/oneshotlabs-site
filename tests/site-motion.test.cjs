const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = ['bio.html', 'contact.html', 'post.html'];

for (const page of pages) {
  const html = read(page);
  assert.match(html, /css\/site-motion\.css\?v=20260919-signatures1/, `${page} loads the local motion stylesheet`);
  assert.match(html, /js\/site-motion\.js\?v=20260919-signatures1/, `${page} loads the local motion controller`);
}

const bio = read('bio.html');
assert.match(bio, /body class="bio-page"/, 'bio opts into the portrait drift signature');
assert.match(bio, /site-motion\.css\?v=20260919-signatures1/, 'bio loads the signature motion stylesheet');

const contact = read('contact.html');
assert.match(contact, /body class="contact-page"/, 'contact opts into the simple stagger signature');
assert.match(contact, /site-motion\.css\?v=20260919-signatures1/, 'contact loads the signature motion stylesheet');
assert.match(contact, /Bring me a consequential problem, an ambitious idea, or a project that deserves a thoughtful build\./, 'contact opens with the approved invitation');

const musings = read('musings.html');
assert.match(musings, /musings-page-turn/, 'Musings carries the storybook page-turn entry');

const photography = read('photography.html');
assert.doesNotMatch(photography, /css\/site-motion\.css/, 'photography keeps its original gallery motion without the shared section reveal');
assert.doesNotMatch(photography, /js\/site-motion\.js/, 'photography does not load the shared section reveal controller');
assert.match(photography, /js\/photography\.js/, 'photography retains its original per-photo reveal behavior');

const ai = read('ai.html');
assert.match(ai, /js\/navy-veil\.js\?v=20260920-ai-route/, 'AI page loads its approved Gold Seam entry motion');
assert.match(ai, /css\/fabric-finish\.css\?v=20260914-merged1/, 'AI page loads the fabric motion system');
assert.match(ai, /js\/fabric-results-globe\.js\?v=20260925-observer-guard/, 'AI page loads the hardened interactive globe');
assert.match(ai, /js\/fabric-questionnaire\.js\?v=20260914-merged1/, 'AI page loads the assessment handoff');

const css = read('css/site-motion.css');
assert.match(css, /\.ai-page \.instrument/, 'AI evidence choreography is present');
assert.match(css, /\.timeline-item\.is-visible \.timeline-photo/, 'photography settling is present');
assert.match(css, /\.contact-block::before/, 'contact closing rule is present');
assert.match(css, /\.bio-page \.about-portrait-wrap/, 'bio portrait drift is present');
assert.match(css, /\.contact-page \.about-copy > h1/, 'contact simple stagger is present');
assert.match(css, /@media \(max-width: 720px\)/, 'mobile-specific motion is present');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, 'reduced-motion direction is present');

const js = read('js/site-motion.js');
assert.match(js, /const isHome/, 'homepage motion is protected from interior-page reveals');
assert.doesNotMatch(js, /is-page-leaving|site-motion-curtain/, 'page navigation is immediate with no decorative wipe');
assert.match(js, /IntersectionObserver/, 'offscreen work is event-driven');

const sharedCss = read('css/style.css');
assert.match(sharedCss, /@media \(max-width: 1024px\)[\s\S]*?\.nav \{[\s\S]*?background: var\(--header-navy\)/, 'compact navigation matches the shared navy masthead');
assert.match(sharedCss, /\.nav-toggle\[aria-expanded="true"\] \.nav-toggle-bar \{ background: var\(--oneshot-warm-white\)/, 'the compact close control stays visible on navy');
const home = read('index.html');
assert.match(home, /@media \(max-width: 1024px\)[\s\S]*?\.nav \{[\s\S]*?background: var\(--header-navy\)/, 'homepage compact navigation matches its navy masthead');
const photographyCss = read('css/photography-editorial.css');
assert.match(photographyCss, /@media \(max-width: 1024px\)[\s\S]*?\.photo-page \.site-header \.nav \{[\s\S]*?background: var\(--oneshot-cream\)/, 'Photography compact navigation matches its cream masthead');
const musingsCss = read('css/musings-header.css');
assert.match(musingsCss, /\.musings-site-header \.mobile-menu > div \{[\s\S]*?background: var\(--cream, var\(--bg, #fffdf8\)\)/, 'Musings compact navigation matches its cream masthead');

const contactPage = read('contact.html');
assert.match(contactPage, /id="contact-form-submit"/, 'contact submit button is wired to the controller');
assert.doesNotMatch(contactPage, /newsletter-form|buttondown/i, 'the retired newsletter account is not shipped');

console.log('PASS: dedicated AI motion and shared site motion cover the merged experience.');
