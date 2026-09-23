const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.resolve(__dirname, '../css/ai-fabric-study.css'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../ai.html'), 'utf8');

assert.match(
  css,
  /\.fabric-material-study\.exploring-system \.fabric\s*\{[^}]*transition:none/s,
  'the expanded system must not animate through the old full-screen layout'
);
assert.match(
  css,
  /\.fabric-material-study\.exploring-system \.fabric \.copy\s*\{\s*display:none!important\s*\}/s,
  'the hero headline must disappear immediately instead of fading through a blurred state'
);
assert.match(
  css,
  /\.fabric-material-study\.exploring-system \.woven-network\s*\{[^}]*animation:none/s,
  'the expanded system must not run a first-open network reveal'
);
assert.match(
  css,
  /\.fabric-material-study\.exploring-system \.fabric::before\s*\{\s*content:none\s*\}/s,
  'the expanded system must not run the first-open light pass'
);
assert.match(
  html,
  /ai-fabric-study\.css\?v=20260920-no-first-click/,
  'the AI page must bypass cached copies of the removed first-click transition'
);

console.log('PASS: the system opens without the first-click transition.');
