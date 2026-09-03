const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/header-brand.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const timeline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).find(s => s.includes('var STAGES ='));
function setup({ splash = false, reduced = false, hidden = false } = {}) {
  let now = 0, complete = 0, requests = 0, cycles = 0;
  const handlers = {}, raf = [], images = [], drawn = [];
  const add = (name, fn) => (handlers[name] ||= []).push(fn);
  const emit = name => (handlers[name] || []).forEach(fn => fn({ type: name }));
  function node() { return { style: {}, setAttribute() {}, appendChild() {},
    classList: { add() {}, remove() {}, toggle() {} },
    getBoundingClientRect: () => ({ top: 10, bottom: 90, left: 10, right: 400, width: 390, height: 80 }) }; }
  const link = node(), curtain = node(), strip = node(), logo = node();
  curtain.style.display = splash ? 'block' : 'none';
  logo.classList.add = name => { if (name === 'nudging') cycles++; };
  strip.querySelectorAll = () => []; strip.querySelector = () => null;
  const fill = node(); fill.parentElement = node();
  const elements = { splash: curtain, 'turn-logo': logo, 'turn-track-fill': fill,
    'turn-eyebrow': node(), 'turn-check': node() };
  const context = { clearRect() {}, drawImage(img, x, y) { drawn.push({ frame: y / 182 * 7 + x / 948, time: now }); } };
  const document = { readyState: 'complete', visibilityState: hidden ? 'hidden' : 'visible',
    querySelector: s => s === '.turn-strip' ? strip : link,
    getElementById: id => elements[id], addEventListener: add,
    createElement: () => ({ ...node(), getContext: () => context }) };
  class Img { constructor() { this.style = {}; this.events = {}; images.push(this); }
    setAttribute() {} addEventListener(n, fn) { this.events[n] = fn; } }
  const media = { matches: reduced, addEventListener(n, fn) { add('media', fn); } };
  const sandbox = { document, Image: Img, Event: class { constructor(type) { this.type = type; } },
    getComputedStyle: el => el === curtain ? curtain.style : { visibility: 'visible', opacity: '1' },
    requestAnimationFrame: fn => raf.push(fn), performance: { now: () => now },
    window: { innerHeight: 800, innerWidth: 1200, matchMedia: () => media,
      addEventListener: add, dispatchEvent: e => emit(e.type) } };
  add('oneshot:header-brand-complete', () => complete++);
  add('oneshot:header-brand-request', () => requests++);
  vm.runInNewContext(timeline, sandbox);
  vm.runInNewContext(code, sandbox);
  const frame = (ms = 20) => { now += ms; raf.splice(0).forEach(fn => fn(now)); };
  const advance = ms => { for (let i = 0; i < ms; i += 20) frame(); };
  return { document, curtain, images, media, drawn, emit, frame, advance,
    ready: () => images[1].events.load(), fail: () => images[1].events.error(),
    stats: () => ({ complete, requests, cycles }) };
}
const normal = setup(); normal.ready(); normal.advance(480);
assert.deepEqual(normal.stats(), { complete: 0, requests: 0, cycles: 0 });
normal.advance(120);
assert.equal(normal.stats().requests, 1, 'Existing 500ms visibility trigger requests header');
assert.equal(normal.stats().cycles, 0, 'Timeline waits while header animates');
normal.advance(1000);
assert.deepEqual(normal.stats(), { complete: 1, requests: 1, cycles: 1 });
assert(normal.drawn.some(x => x.frame > 0 && x.frame < 41), 'Intermediate underline frames actually drawn');
assert.equal(normal.drawn.at(-1).frame, 41, 'Settled frame holds');
const firstMotion = normal.drawn.find(x => x.frame === 1);
const settled = normal.drawn.find(x => x.frame === 41);
assert.equal(settled.time - firstMotion.time, 800, 'Original 50fps/820ms motion preserved');
normal.emit('oneshot:header-brand-request'); normal.emit('pageshow'); normal.advance(8000);
assert.equal(normal.stats().complete, 1); assert.equal(normal.stats().cycles, 1);
const blocked = setup({ splash: true }); blocked.ready(); blocked.advance(2000);
assert.equal(blocked.stats().requests, 0);
blocked.curtain.style.display = 'none'; blocked.advance(1600); assert.equal(blocked.stats().cycles, 1);
const slow = setup(); slow.advance(1600); assert.equal(slow.stats().cycles, 0);
slow.ready(); slow.advance(1000); assert.equal(slow.stats().cycles, 1);
const tab = setup(); tab.ready(); tab.advance(700);
tab.document.visibilityState = 'hidden'; tab.emit('visibilitychange'); tab.advance(5000);
assert.equal(tab.stats().complete, 0, 'Hidden tab cannot consume the animation');
tab.document.visibilityState = 'visible'; tab.emit('visibilitychange'); tab.advance(1000);
assert.equal(tab.stats().cycles, 1);
const rm = setup({ reduced: true }); rm.ready(); rm.advance(600); assert.equal(rm.stats().cycles, 1);
const fail = setup(); fail.fail(); fail.advance(600); assert.equal(fail.stats().cycles, 1, 'Asset failure cannot deadlock timeline');
assert(!/AudioContext|createOscillator|play\w+Sfx|getAudioCtx/.test(html), 'Splash remains silent');
for (const s of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(s[1]);
console.log('PASS: integrated header→timeline order, actual frame progression, 820ms motion, once-only playback, splash, slow loading, hidden-tab pause, reduced motion, failure fallback and silent splash.');
