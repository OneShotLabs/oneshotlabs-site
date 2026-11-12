const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const guard = fs.readFileSync(path.join(root, 'scripts/verify-production-source.cjs'), 'utf8');

assert.match(packageJson.scripts['deploy:production'], /verify:production-source/);
assert.match(packageJson.scripts['verify:production-source'], /catalog-additive\.test\.cjs/);
assert.match(guard, /git\(\['fetch', 'origin', 'main', '--quiet'\]\)/);
assert.match(guard, /branch !== 'main'/);
assert.match(guard, /head !== originMain/);
assert.match(guard, /status', '--porcelain', '--untracked-files=all/);
assert.match(guard, /Production deploy blocked/);

console.log('PASS: production deploys require a clean exact main and the protected Musings catalog.');

assert.match(guard, /fs\.realpathSync\(process\.cwd\(\)\) !== canonicalRoot/);
assert.ok(guard.includes('/Users/davidjergovic/Documents/Codex/oneshotlens-site'));
assert.equal(packageJson.scripts['deploy:production'],'npm run verify:production-source && npm run build && netlify deploy --prod --dir dist');
const config = fs.readFileSync(path.join(root,'netlify.toml'),'utf8');
assert.match(config,/command = "npm run build"/);assert.match(config,/publish = "dist"/);
for(const scheme of ['http','https']) for(const host of ['oneshotlabsai.com','www.oneshotlabsai.com']) {
  const rule=`from = "${scheme}://${host}/*"\nto = "https://oneshotlens.com/"\nstatus = 301\nforce = true`;
  assert.ok(config.includes(rule),`Parent alias must redirect every path to the hub: ${scheme}://${host}`);
}
