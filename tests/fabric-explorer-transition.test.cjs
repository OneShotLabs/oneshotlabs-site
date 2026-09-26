const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.resolve(__dirname, '../css/ai-fabric-study.css'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../ai.html'), 'utf8');
const explorer = fs.readFileSync(path.resolve(__dirname, '../js/fabric-explorer.js'), 'utf8');
const cloth = fs.readFileSync(path.resolve(__dirname, '../js/fabric-cloth-3d.js'), 'utf8');
const lumen = fs.readFileSync(path.resolve(__dirname, '../css/lumen.css'), 'utf8');

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
  /ai-fabric-study\.css\?v=20260925-scroll-release/,
  'the AI page must bypass cached copies of the removed first-click transition'
);
assert.match(explorer, /heroCopy\.hidden=expansion\.open/, 'the explored state must remove the hero copy from the DOM render tree');
assert.match(html, /fabric-cloth-3d\.js\?v=20260925-approved-pose/, 'the AI page must load the approved interactive 3D cloth presentation');
assert.match(cloth, /controls\.enableZoom=false/, 'wheel zoom must stay disabled so the page can scroll to the AI Curve');
assert.match(cloth, /Scroll down to continue/, 'the expanded installation must explain the onward scroll behavior');
assert.match(lumen, /touch-action:pan-y/, 'vertical touch gestures must continue to scroll the page');
assert.match(css, /overscroll-behavior-y:auto/, 'the expanded system must allow scroll chaining to the AI Curve');
assert.match(cloth, /new T\.Vector3\(-\.39,\.13,-\.91\)/, 'the initial fabric camera must use the approved two-peak presentation');

console.log('PASS: the system opens without the first-click transition.');
