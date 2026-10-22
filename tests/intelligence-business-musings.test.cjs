const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const slug = 'the-intelligence-inside-your-business';

test('Leveraging the Intelligence Within Your Business uses the approved article copy and editorial art', () => {
  const post = read(`posts/${slug}.md`);
  assert.match(post, /title: Leveraging the Intelligence Within Your Business/);
  assert.match(post, /collection: Perspectives/);
  assert.match(post, /Trust will depend on showing users not only the answer but also the path used to reach it\./);
  assert.match(post, /institutional-grade solution\./);
  assert.match(post, /apply that judgment quicker and with greater consistency\./);
  assert.match(post, /coverTreatment: editorial/);
  assert.match(post, /dropCap: false/);

  const shell = read(`musings/${slug}/index.html`);
  assert.match(shell, new RegExp(`rel="canonical" href="https://oneshotlens\\.com/musings/${slug}"`));
  assert.match(shell, /property="og:type" content="article"/);
  assert.match(shell, /property="og:image" content="https:\/\/oneshotlens\.com\/assets\/editorial\/the-intelligence-inside-your-business-social\.png"/);
  assert.match(shell, /property="og:image:width" content="1200"/);
  assert.match(shell, /property="og:image:height" content="630"/);
  assert.match(shell, /name="twitter:card" content="summary_large_image"/);

  const social = fs.readFileSync(path.join(root, 'assets/editorial/the-intelligence-inside-your-business-social.png'));
  assert.equal(social.toString('ascii', 1, 4), 'PNG');
  assert.equal(social.readUInt32BE(16), 1200);
  assert.equal(social.readUInt32BE(20), 630);

  const index = read('musings.html');
  assert.match(index, /Leveraging the Intelligence Within Your Business/);
  assert.match(index, /assets\/editorial\/the-intelligence-inside-your-business-hero\.png/);
  assert.match(index, /id="perspectives"/);
  assert.match(index, /id="studio"/);
  assert.match(index, /id="view-finder"/);
  assert.equal((index.match(/perspective-feature/g) || []).length >= 2, true);
  assert.match(index, /OneShotLens editorial illustration · September 2026/);
  assert.doesNotMatch(index, /href="#perspectives">Read Perspectives/);
  assert.match(index, /#perspectives\{border-bottom:1px solid var\(--navy\)\}/);
  assert.match(index, /#perspectives \.story>\.read\{justify-self:start;align-self:start\}/);
  assert.ok(index.indexOf('id="perspectives"') < index.indexOf('id="studio"'));
  assert.ok(index.indexOf('id="studio"') < index.indexOf('id="view-finder"'));
  assert.ok(index.indexOf('id="view-finder"') < index.indexOf('/musings/systems-thinkers-netflix'));
});
