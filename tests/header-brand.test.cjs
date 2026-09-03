const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/header-brand.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup({ hiddenSplash = false, hiddenTab = false, reduced = false } = {}) {
  const handlers = {}, raf = [], images = [];
  let resolveFetch, blobCount = 0;
  const splash = { style: { display: hiddenSplash ? 'none' : 'block' } };
  const link = { setAttribute() {}, classList: { add() {}, remove() {} }, appendChild() {},
    getBoundingClientRect: () => ({ top: 10, left: 10, bottom: 50, right: 210, width: 200, height: 40 }) };
  const document = { visibilityState: hiddenTab ? 'hidden' : 'visible', readyState: 'complete',
    querySelector: () => link, getElementById: () => splash, addEventListener: (n, fn) => { handlers[n] = fn; } };
  const media = { matches: reduced, addEventListener(n, fn) { handlers.media = fn; } };
  class Img { constructor() { images.push(this); } setAttribute() {} addEventListener() {} }
  class Observer { constructor(fn) { this.fn = fn; } observe() {} disconnect() {} }
  vm.runInNewContext(code, { document, Image: Img, MutationObserver: Observer, IntersectionObserver: Observer,
    getComputedStyle: el => el === splash ? splash.style : { visibility: 'visible', opacity: '1' },
    requestAnimationFrame: fn => raf.push(fn),
    window: { innerHeight: 800, innerWidth: 1200, matchMedia: () => media,
      addEventListener: (n, fn) => { handlers[n] = fn; } },
    fetch: () => new Promise(resolve => { resolveFetch = resolve; }),
    URL: { createObjectURL: () => { blobCount++; return 'blob:motion'; }, revokeObjectURL() {} },
    sessionStorage: { getItem: () => { throw Error('Header must not depend on session storage'); } },
  });
  return { document, splash, link, handlers, media, raf, images,
    count: () => blobCount, frame: () => { const queue = raf.splice(0); queue.forEach(fn => fn()); },
    ready: async () => { resolveFetch({ ok: true, blob: async () => ({}) }); await flush(); } };
}
(async () => {
  const s = setup(); await s.ready();
  assert.equal(s.raf.length, 0, 'Must not animate behind splash');
  s.splash.style.display = 'none'; s.handlers['oneshot:header-brand-start']();
  s.frame(); assert.equal(s.count(), 0, 'Allow main page to paint');
  s.frame(); assert.equal(s.count(), 1);
  s.handlers['oneshot:header-brand-start'](); s.handlers.pageshow(); s.frame(); s.frame();
  assert.equal(s.count(), 1, 'No replay from repeated splash events or history restoration');

  const slow = setup({ hiddenSplash: true }); slow.handlers.load();
  slow.frame(); slow.frame(); assert.equal(slow.count(), 0);
  await slow.ready(); slow.frame(); slow.frame(); assert.equal(slow.count(), 1, 'Late asset still plays');

  const tab = setup({ hiddenSplash: true, hiddenTab: true }); await tab.ready();
  assert.equal(tab.raf.length, 0); tab.document.visibilityState = 'visible';
  tab.handlers.visibilitychange(); tab.frame(); tab.document.visibilityState = 'hidden'; tab.frame();
  assert.equal(tab.count(), 0, 'Visibility rechecked before playback');
  tab.document.visibilityState = 'visible'; tab.handlers.visibilitychange(); tab.frame(); tab.frame();
  assert.equal(tab.count(), 1);

  const reduced = setup({ hiddenSplash: true, reduced: true }); reduced.handlers.load();
  reduced.frame(); reduced.frame(); assert.equal(reduced.count(), 0);
  const loading = setup({ hiddenSplash: true }); loading.document.readyState = 'interactive';
  await loading.ready(); assert.equal(loading.raf.length, 0);
  loading.document.readyState = 'complete'; loading.handlers.load(); loading.frame(); loading.frame();
  assert.equal(loading.count(), 1);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert(!/AudioContext|createOscillator|play\w+Sfx|getAudioCtx/.test(html), 'No splash audio remains');
  for (const s of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(s[1]);
  console.log('PASS: splash gating, two-frame paint delay, one play, late assets, hidden tabs, reduced motion, page loading, silent splash and inline syntax.');
})().catch(error => { console.error(error); process.exitCode = 1; });
