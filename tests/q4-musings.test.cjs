const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const post = read('posts/q4-is-here-lets-finish-strong.md');
assert.match(post, /title: Q4 Is Here\. Let’s Finish Strong\./);
assert.match(post, /tags: \[ai-video, generative-ai, marketing\]/);
assert.match(post, /collection: Studio/);
assert.match(post, /creative and commercial opportunities/);
assert.match(post, /video: \/assets\/video\/q4-is-here-lets-finish-strong\.mp4/);
assert.doesNotMatch(post, /<figure class="musings-video">/);
assert.doesNotMatch(post, /<figcaption>Q4 Is Here/);

const shell = read('musings/q4-is-here-lets-finish-strong/index.html');
assert.match(shell, /property="og:type" content="article"/);
assert.match(shell, /"@type": "VideoObject"/);
assert.match(shell, /<meta property="article:tag" content="AI Video"/);
assert.match(shell, /<meta property="article:tag" content="Generative AI"/);
assert.match(shell, /<meta property="article:tag" content="Marketing"/);
assert.match(shell, /rel="canonical" href="https:\/\/oneshotlens\.com\/musings\/q4-is-here-lets-finish-strong"/);

const index = read('musings.html');
assert.match(index, /id="lead"/);
assert.match(index, /id="studio"/);
assert.match(index, />Studio<\/h2>/);
assert.match(index, /<span class="quarter-mark" aria-label="Q4">/);
assert.ok(index.indexOf('id="lead"') < index.indexOf('id="studio"'), 'lead perspective remains pinned above Studio work');

const image = fs.readFileSync(path.join(root, 'assets/editorial/q4-is-here-lets-finish-strong.jpg'));
assert.equal(image.toString('ascii', 6, 10), 'JFIF');
assert.ok(fs.statSync(path.join(root, 'assets/video/q4-is-here-lets-finish-strong.mp4')).size > 1_000_000);

const styles = read('css/style.css');
assert.match(styles, /\.post-monument-photo--editorial \.post-monument-video,[\s\S]*?\{[\s\S]*?width: 70%;[\s\S]*?aspect-ratio: 16 \/ 9;/);
assert.match(read('js/musings.js'), /class="post-monument-video" controls playsinline/);
assert.match(styles, /\.post-title-quarter/);
assert.match(styles, /\.post-title-q-glyph::after/);

console.log('PASS: Q4 Musings post includes video SEO metadata and appears in Studio beneath the lead perspective.');
