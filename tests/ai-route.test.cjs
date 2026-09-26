const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const publicPages = ['index.html', 'career.html', 'contact.html', 'bio.html', 'photography.html', 'post.html', 'musings.html', 'ai.html'];

assert.equal(fs.existsSync(path.join(root, 'ai-consulting.html')), false, 'the old AI filename must be removed');
assert.ok(fs.existsSync(path.join(root, 'ai.html')), 'the canonical AI page must be ai.html');

for (const page of publicPages) {
  assert.doesNotMatch(read(page), /ai-consulting/, `${page} must not reference the retired route`);
}

const ai = read('ai.html');
assert.match(ai, /rel="canonical" href="https:\/\/oneshotlens\.com\/ai"/, 'AI canonical URL must be /ai');
assert.match(ai, /data-share-url="https:\/\/oneshotlens\.com\/ai#ai-curve"/, 'AI share URL must use /ai');

const config = read('netlify.toml');
assert.match(config, /from = "\/ai-consulting"\s+to = "\/ai"\s+status = 301/s, 'old clean route redirects to /ai');
assert.match(config, /from = "\/ai-consulting\.html"\s+to = "\/ai"\s+status = 301/s, 'old HTML route redirects to /ai');
assert.match(config, /from = "\/ai"\s+to = "\/ai\.html"\s+status = 200/s, '/ai serves the AI page');

console.log('PASS: /ai is the single canonical AI route.');
