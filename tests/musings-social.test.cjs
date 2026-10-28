const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const post = read('posts/ai-has-a-branding-problem.md');
assert.match(post, /title: A Technology for Human Ambition/);
assert.match(post, /excerpt: The loudest story about AI is what it may take away\. The more interesting story is what it puts within reach\./);
assert.match(post, /---\n\nAI has a branding problem\.\n\nWe have been handed the most transformational technology/);
assert.match(post, /I am not going to sit back and watch the future arrive from the sidelines\.\n\nWill you\?\s*$/);
assert.match(post, /cover: \/assets\/editorial\/ai-has-a-branding-problem-hero-v2\.png/);
assert.match(post, /coverTreatment: editorial/);
assert.match(post, /dropCap: false/);
assert.match(post, /socialImage: \/assets\/editorial\/ai-has-a-branding-problem-social-v2\.png/);

const shell = read('musings/ai-has-a-branding-problem/index.html');
assert.match(shell, /property="og:type" content="article"/);
assert.match(shell, /property="og:image" content="https:\/\/oneshotlens\.com\/assets\/editorial\/ai-has-a-branding-problem-social-v2\.png"/);
assert.match(shell, /property="og:image:width" content="1200"/);
assert.match(shell, /property="og:image:height" content="630"/);
assert.match(shell, /name="twitter:card" content="summary_large_image"/);
assert.match(shell, /rel="canonical" href="https:\/\/oneshotlens\.com\/musings\/ai-has-a-branding-problem"/);

const social = fs.readFileSync(path.join(root, 'assets/editorial/ai-has-a-branding-problem-social-v2.png'));
assert.equal(social.toString('ascii', 1, 4), 'PNG');
assert.equal(social.readUInt32BE(16), 1200);
assert.equal(social.readUInt32BE(20), 630);

const index = read('musings.html');
assert.match(index, /A Technology for Human Ambition/);
assert.match(index, /The loudest story about AI is what it may take away\. The more interesting story is what it puts within reach\./);
assert.match(index, /assets\/editorial\/ai-has-a-branding-problem-hero-v2\.png/);
assert.match(index, /systems-thinkers-netflix/);
assert.match(index, /View Finder · Edition 001/);
assert.match(index, /All opinions expressed here are my own and do not reflect the views of my employer\./);

const manifest = JSON.parse(read('posts/manifest.json'));
assert.deepEqual(manifest.posts, ['the-fabric', 'the-intelligence-inside-your-business', 'luck-by-design', 'taking-an-idea-further-with-ai', 'systems-thinkers-netflix', 'q4-is-here-lets-finish-strong', 'ai-has-a-branding-problem']);
const netlifyConfig = read('netlify.toml');
assert.match(netlifyConfig, /from = "\/musings\/systems-thinkers-netflix"[\s\S]*?to = "\/musings\/systems-thinkers-netflix\/index\.html"[\s\S]*?status = 200/);

const articleTemplate = read('post.html');
assert.match(articleTemplate, /class="musings-site-header"/);
assert.match(articleTemplate, /css\/musings-header\.css/);
assert.doesNotMatch(articleTemplate, /<header class="site-header">/);
assert.match(shell, /class="musings-site-header"/);
assert.match(shell, /css\/musings-header\.css/);

const script = read('js/musings.js');
assert.match(script, /post-body-content--no-drop-cap/);
assert.match(script, /isEditorial \? "" : `<p class="post-monument-eyebrow"/);
const styles = read('css/style.css');
assert.match(styles, /\.post-monument-photo--editorial \.post-monument-meta::before \{ display: none; \}/);
assert.match(styles, /\.post-monument-photo--editorial \.post-monument-tags \{ margin-left: 0; \}/);
assert.match(styles, /\.post-article-copy \.post-body-content > p:last-child \{[\s\S]*?font-family: inherit;[\s\S]*?font-size: inherit;[\s\S]*?line-height: inherit;/);

console.log('PASS: the AI branding post uses the selected hero and exposes a 1200x630 social card with static metadata.');
