const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = ['index.html', 'bio.html', 'blog.html', 'career.html', 'contact.html', 'photography.html', 'post.html', 'ai-consulting.html'];

for (const page of pages) {
  const html = read(page);
  assert.match(html, /js\/navy-veil\.js\?v=20260914-cinema2/, `${page} loads the approved Gold Seam transition`);
}

const script = read('js/navy-veil.js');
assert.match(script, /ai-consulting/, 'transition is scoped to the AI destination');
assert.match(script, /sessionStorage\.setItem/, 'departure and arrival share a short-lived handoff');
assert.match(script, /Gold Seam/, 'the approved Gold Seam transition is the production motion');
assert.match(script, /Date\.now\(\) - Number\(sessionStorage\.getItem\(HANDOFF_KEY\)\) < 15000/, 'arrival handoff expires safely');
assert.match(script, /prefers-reduced-motion:reduce/, 'reduced-motion visitors receive a shortened transition');
assert.match(script, /event\.metaKey\s*\|\|\s*event\.ctrlKey\s*\|\|\s*event\.shiftKey\s*\|\|\s*event\.altKey/, 'modified clicks keep native browser behavior');
assert.match(script, /pageshow/, 'back-forward cache restores navigation safely');
assert.match(read('ai-consulting.html'), /ai-prepaint/, 'AI first paint is held behind navy to prevent a flash');

console.log('PASS: the AI-only navy veil is wired across every page and preserves native navigation safeguards.');
