const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const published = [
  'the-intelligence-inside-your-business',
  'luck-by-design',
  'taking-an-idea-further-with-ai',
  'systems-thinkers-netflix',
  'q4-is-here-lets-finish-strong',
  'ai-has-a-branding-problem',
];

test('the complete published Musings catalog is present before deployment', () => {
  const manifest = JSON.parse(read('posts/manifest.json'));
  assert.deepEqual(manifest.posts, published);

  const index = read('musings.html');
  const sitemap = read('sitemap.xml');

  for (const slug of published) {
    assert.ok(fs.existsSync(path.join(root, 'posts', `${slug}.md`)), `${slug} markdown is missing`);
    assert.match(index, new RegExp(`/musings/${slug}`), `${slug} is missing from the Musings index`);
    assert.match(sitemap, new RegExp(`https://oneshotlens\\.com/musings/${slug}`), `${slug} is missing from the sitemap`);
  }
});

test('video posts retain their production media and social metadata', () => {
  const requiredFiles = [
    'assets/editorial/luck-by-design.jpg',
    'assets/editorial/taking-an-idea-further-with-ai.jpg',
    'assets/video/luck-by-design.mp4',
    'assets/video/taking-an-idea-further-with-ai-4k.mp4',
    'musings/luck-by-design/index.html',
    'musings/taking-an-idea-further-with-ai/index.html',
  ];

  for (const file of requiredFiles) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} is missing`);
  }

  for (const slug of ['luck-by-design', 'taking-an-idea-further-with-ai']) {
    const post = read(`posts/${slug}.md`);
    assert.match(post, /^socialImage: \/assets\/editorial\//m);
    assert.match(post, /^socialAlt: .+/m);
    assert.match(post, /^socialDescription: .+/m);
  }

  const luckShell = read('musings/luck-by-design/index.html');
  assert.match(luckShell, /rel="canonical" href="https:\/\/oneshotlens\.com\/musings\/luck-by-design"/);
  assert.match(luckShell, /property="og:url" content="https:\/\/oneshotlens\.com\/musings\/luck-by-design"/);
  assert.match(luckShell, /name="twitter:card" content="summary_large_image"/);

  const panForwardShell = read('musings/taking-an-idea-further-with-ai/index.html');
  assert.match(panForwardShell, /rel="canonical" href="https:\/\/oneshotlens\.com\/musings\/taking-an-idea-further-with-ai"/);
  assert.match(panForwardShell, /property="og:url" content="https:\/\/oneshotlens\.com\/musings\/taking-an-idea-further-with-ai"/);
  assert.match(panForwardShell, /name="twitter:card" content="summary_large_image"/);
});
