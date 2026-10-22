const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const post = read('posts/systems-thinkers-netflix.md');
assert.match(post, /title: Step Out One Click/);
assert.match(post, /date: 2026-10-02/);
assert.match(post, /tags: \[shared-media, clips, ai, systems-thinking\]/);
assert.match(post, /youtube: https:\/\/www\.youtube-nocookie\.com\/embed\/t0GiTyz4syY\n/);
assert.doesNotMatch(post, /start=|[&?]t=/);
assert.match(post, /videoCover: \/assets\/editorial\/step-out-one-click-cover-v2\.png/);
assert.match(post, /collection: View Finder/);
const bodyWords = post.split('---')[2].replace(/\*\[Watch on YouTube\][^\n]+/, '').trim().split(/\s+/).length;
assert.ok(bodyWords >= 250 && bodyWords <= 300, `Article has ${bodyWords} words`);
assert.match(post, /edition: 001/);
assert.doesNotMatch(post, /assets\/musings\/bridge\.jpg/);
assert.match(post, /Design the system to become the standard for how the work gets done/);
assert.doesNotMatch(post, /—/);

const script = read('js/musings.js');
assert.match(script, /class="post-monument-video-cover"/);
assert.match(script, /view-finder-original-wordmark\.png" alt="View Finder"/);
assert.match(script, /class="video-cover-edition">Edition \$\{post\.edition \|\| "001"\}/);
assert.match(script, /class="video-cover-subtitle">\$\{post\.title\}/);
assert.match(script, /videoCover\.replaceWith\(iframe\)/);
assert.match(script, /src\.searchParams\.set\('start', '0'\)/);
assert.match(script, /Play the clip here from the beginning/);
assert.doesNotMatch(post, /\[Watch on YouTube\]/);
assert.match(script, /class="sr-only"/);
assert.match(script, /referrerpolicy="strict-origin-when-cross-origin"/);
assert.match(script, /loading="lazy"/);

const styles = read('css/style.css');
assert.doesNotMatch(script, />Featured clip</);
assert.match(styles, /right: 53%;/);
assert.match(styles, /border: 1px solid #1d2f4e/);
assert.match(styles, /width: 5\.1cqw/);
assert.match(styles, /\.post-monument-photo--editorial \.post-monument-youtube/);
assert.match(styles, /\.video-cover-copy/);
assert.match(styles, /\.video-cover-title[\s\S]*?font-size: 8\.2cqw/);
assert.match(styles, /\.video-cover-copy[\s\S]*?left: 5\.5%/);

const shell = read('musings/systems-thinkers-netflix/index.html');
assert.match(shell, /<title>Step Out One Click — OneShotLens Musings<\/title>/);
assert.match(shell, /property="article:tag" content="Shared Media"/);
assert.match(shell, /property="article:tag" content="Clips"/);
assert.match(shell, /"@type": "VideoObject"/);
assert.match(shell, /rel="canonical" href="https:\/\/oneshotlens\.com\/musings\/systems-thinkers-netflix"/);

const index = read('musings.html');
assert.match(index, /id="view-finder"/);
assert.match(index, /class="story view-finder-story" id="view-finder"/);
assert.match(index, /View Finder · Edition 001/);
assert.ok(index.indexOf('id="studio"') < index.indexOf('id="view-finder"'));
assert.ok(index.indexOf('id="view-finder"') < index.indexOf('/musings/systems-thinkers-netflix'));

const sitemap = read('sitemap.xml');
assert.match(sitemap, /https:\/\/oneshotlens\.com\/musings\/systems-thinkers-netflix/);

console.log('PASS: Systems Thinkers is a responsive Shared Media clip with static metadata and a privacy-enhanced YouTube embed.');
