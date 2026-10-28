const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
test('Fabric publishes seven archived chapters and the approved model history', () => {
  const html = read('musings/the-fabric/index.html');
  assert.equal((html.match(/class="frame"/g) || []).length, 7);
  assert.equal((html.match(/data-slide="/g) || []).length, 7);
  assert.match(html, /7 of 7: The fabric, illuminated/);
  assert.match(html, /October 27, 2026 · live site capture/);
  assert.match(html, /October 2, 2026 · previous iteration/);
  assert.match(html, /I began the idea with Claude Sonnet, developed the current design in ChatGPT Astra 6, and completed the finishing polish in Opus 5.5\./);
  assert.doesNotMatch(html, /oneshotlabs|localhost|127\.0\.0\.1/i);
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)/g)) {
    assert.ok(fs.existsSync(path.join(root, m[1])), `Missing ${m[1]}`);
  }
  assert.match(html, /rel="canonical" href="https:\/\/oneshotlens.com\/musings\/the-fabric"/);
  assert.match(read('netlify.toml'), /from = "\/musings\/the-fabric"[\s\S]*?status = 200/);
});
test('Evolutions leads and Perspectives remain grouped without preview controls', () => {
  const html = read('musings.html');
  const section = html.match(/<section id="perspectives"[\s\S]*?<\/section>/)[0];
  assert.match(section, /Leveraging the Intelligence Within Your Business/);
  assert.match(section, /A Technology for Human Ambition/);
  assert.ok(html.indexOf('class="evolutions"') < html.indexOf('id="perspectives"'));
  assert.doesNotMatch(html, /TYPOGRAPHY STUDY|Ideas taking shape|A MUSINGS SPECIAL/);
});
