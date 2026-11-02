const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const guard = fs.readFileSync(path.join(root, 'scripts/verify-production-source.cjs'), 'utf8');

assert.match(packageJson.scripts['deploy:production'], /verify:production-source/);
assert.match(packageJson.scripts['verify:production-source'], /published-musings-catalog\.test\.cjs/);
assert.match(guard, /git\(\['fetch', 'origin', 'main', '--quiet'\]\)/);
assert.match(guard, /git\(\['merge-base', '--is-ancestor', 'origin\/main', 'HEAD'\]\)/);
assert.match(guard, /Production deploy blocked/);

console.log('PASS: production deploys require current main and the protected Musings catalog.');
