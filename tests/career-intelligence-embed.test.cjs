const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const career = read('career.html');
const embed = read('career-intelligence/index.html');
const embedCss = read('career-intelligence/styles.css');
const embedJs = read('career-intelligence/app.js');

assert.match(career, /src="career-intelligence\/index\.html"/, 'Career loads the applied intelligence portfolio');
assert.ok(career.indexOf('career-intelligence-section') > career.indexOf('section section-tint'), 'portfolio follows the experience section');
assert.ok(career.indexOf('career-intelligence-section') < career.indexOf('site-footer'), 'portfolio is the final section before the footer');
assert.match(career, /career-intelligence-ready/, 'Career waits for the embedded system before activation');
assert.match(career, /career-intelligence-activated/, 'Career confirms embedded activation before ending retries');
assert.match(career, /IntersectionObserver/, 'Career activates the system on viewport entry');
assert.match(embed, /class="career-embed"/, 'embedded document uses its shell-free layout');
assert.match(embedCss, /--brand-navy:\s*#1d2f4e/, 'embedded system uses the canonical brand navy');
assert.match(embedJs, /career-intelligence-activate/, 'embedded animation waits for the Career page signal');
assert.match(embedJs, /pageshow/, 'embedded animation re-announces readiness after browser cache restores');

console.log('PASS: Applied Intelligence Systems is the final interactive Career section and preserves the approved brand system.');
