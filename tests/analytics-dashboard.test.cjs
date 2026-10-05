const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const html = read('analytics-dashboard.html');
const client = read('js/analytics-dashboard.js');
const events = read('netlify/functions/analytics-events.mjs');
const report = read('netlify/functions/analytics-report.mjs');
const config = read('netlify.toml');

assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive">/);
assert.match(html, /What deserves attention now\./);
assert.match(html, /Build a trackable link\./);
assert.doesNotMatch(html, /js\/analytics\.js/);
assert.match(client, /sessionStorage\.getItem\("osl-report-token"\)/);
assert.doesNotMatch(client, /localStorage/);
assert.match(client, /Authorization: `Bearer \$\{state\.token\}`/);
assert.match(client, /chart-y-label/);
assert.match(client, /scaled from 0 to \$\{number\.format\(chartMax\)\} events/);
assert.match(events, /countryCode:/);
assert.match(events, /region:/);
assert.doesNotMatch(events, /context\.ip|user-agent|formData/i);
assert.match(report, /campaigns:/);
assert.match(report, /geography:/);
assert.match(report, /channels:/);
assert.match(report, /X-Robots-Tag/);
assert.match(config, /from = "\/dashboard"[\s\S]+to = "\/analytics-dashboard\.html"/);
assert.match(config, /for = "\/analytics-dashboard\.html"[\s\S]+X-Robots-Tag = "noindex, nofollow, noarchive"/);
assert.match(config, /for = "\/dashboard"[\s\S]+Cache-Control = "private, no-store"[\s\S]+X-Robots-Tag = "noindex, nofollow, noarchive"/);

console.log('PASS: protected branded analytics dashboard and expanded reporting are wired.');
