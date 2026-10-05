const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const timeline = fs.readFileSync(path.join(root, 'js/photography.js'), 'utf8');

const imported = [
  'photo-2024-08-baby-pink.jpg',
  'photo-2024-08-mother-baby-beach.jpg',
  'photo-2025-10-girl-bulldog-mural.jpg',
  'photo-2025-10-upside-down-costume.jpg',
  'photo-2025-09-wrigley-field-game.jpg',
  'photo-2025-10-halloween-family.jpg',
  'photo-2026-02-winter-mountains.jpg',
  'photo-2026-03-child-profile.jpg',
  'photo-2026-08-beach-girl.jpg',
  'photo-2026-08-birthday-card.jpg',
  'photo-2026-09-concert-smoke.jpg',
  'photo-2026-09-concert-laser-silhouette.jpg',
];

for (const file of imported) {
  assert.match(timeline, new RegExp(`images/${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${file} must be present in the timeline`);
  assert.ok(fs.existsSync(path.join(root, 'images', file)), `${file} must exist on disk`);
}

const archived = [
  'photo-2026-08-beach-shell.jpg',
  'photo-2024-04-boat-deck-girl.jpg',
  'photo-2026-04-beach-bucket-v2.jpg',
  'photo-2024-07-watering-flowers.jpg',
  'photo-2024-10-halloween-witch.jpg',
  'photo-2025-03-siblings-closeup.jpg',
  'photo-2024-08-crawl-bw.jpg',
];

const removedByReview = [
  'photo-2025-05-boardwalk-shadow.jpg',
  'photo-2026-09-fishing-boats.webp',
];

for (const file of archived) {
  assert.doesNotMatch(timeline, new RegExp(`images/${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${file} must not appear in the timeline`);
}

for (const file of removedByReview) {
  assert.doesNotMatch(timeline, new RegExp(`images/${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${file} must not appear in the timeline`);
}

assert.match(timeline, /photo-2025-10-upside-down-costume\.jpg[\s\S]*?ratio:\s*"1184 \/ 1776"/, 'the window-light portrait must render vertically');
assert.match(timeline, /photo-2024-08-mother-baby-beach\.jpg[\s\S]*?ratio:\s*"1184 \/ 1776"[\s\S]*?visibility:\s*"private"/, 'the mother-and-baby beach portrait must render vertically on Home');
assert.match(timeline, /photo-2026-02-winter-mountains\.jpg[\s\S]*?location:\s*"Aspen"/, 'the winter mountain photo must be labeled Aspen');
assert.match(timeline, /photo-2025-09-wrigley-field-game\.jpg[\s\S]*?location:\s*"Wrigley Field"/, 'the baseball game must be labeled Wrigley Field');
assert.match(timeline, /photo-2025-10-halloween-family\.jpg[\s\S]*?month:\s*"October"[\s\S]*?year:\s*2025[\s\S]*?visibility:\s*"private"/, 'the street-family photo must use its EXIF month and year on Home');
assert.doesNotMatch(timeline, /pinBefore/, 'timeline order must never contain editorial jumps');

const sources = [...timeline.matchAll(/src:\s*["'](images\/[^"']+)["']/g)].map(match => match[1]);
assert.equal(sources.length, new Set(sources).size, 'timeline image sources must not be duplicated');
for (const source of sources) assert.ok(fs.existsSync(path.join(root, source)), `${source} must resolve to a local image`);

console.log('PASS: the photography timeline matches the current Drive selection and excludes archived photos.');
