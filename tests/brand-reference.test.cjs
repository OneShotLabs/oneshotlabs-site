const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const self = path.relative(root, __filename);
const oldBrand = new RegExp(['one', 'shot', '[ _-]?', 'labs'].join(''), 'ig');
const findings = [];
const legacyNames = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.netlify' || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!entry.isFile() || relative === self) continue;
    if (oldBrand.test(entry.name)) legacyNames.push(relative);
    oldBrand.lastIndex = 0;
    const bytes = fs.readFileSync(absolute);
    if (bytes.subarray(0, 8192).includes(0)) continue;
    const lines = bytes.toString('utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      oldBrand.lastIndex = 0;
      if (oldBrand.test(line)) findings.push({ relative, line: index + 1, text: line.trim() });
    });
  }
}

walk(root);

assert.deepEqual(legacyNames, [], 'No website asset or source filename should retain the former brand');
assert.equal(findings.length, 2, `Unexpected former-brand references:\n${JSON.stringify(findings, null, 2)}`);
for (const finding of findings) {
  assert.equal(finding.relative, 'contact.html');
  assert.match(finding.text, /buttondown\.com/);
}

console.log('PASS: OneShotLens is used throughout the website; only the verified working Buttondown account slug remains as an external dependency.');
