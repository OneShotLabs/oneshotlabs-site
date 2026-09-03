const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/header-static.css'), 'utf8');
assert(html.includes('css/header-static.css?v='));
assert(!html.includes('js/header-brand.js'));
assert(!html.includes('oneshot:header-brand-'));
assert(!html.includes('classList.add("brand-shimmer-play")'));
assert(css.includes('animation: none !important'));
assert(css.includes('background-size: 100% 2.3px'));
assert(html.includes('class="logo-icon"') && html.includes('class="logo-text">OneShotLabs'));
assert(!/AudioContext|createOscillator|play\w+Sfx|getAudioCtx/.test(html));
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach(s => new vm.Script(s));
const timeline = scripts.find(s => s.includes('var STAGES ='));
let now = 0, cycles = 0;
const raf = [];
function node() { return { style: {}, classList: { add() {}, remove() {}, toggle() {} },
  getBoundingClientRect: () => ({ top: 10, left: 10, bottom: 100, right: 600, width: 590, height: 90 }) }; }
const strip = node(), splash = node(), logo = node(), fill = node();
strip.querySelectorAll = () => []; strip.querySelector = () => null;
splash.style.display = 'block'; fill.parentElement = node();
logo.classList.add = name => { if (name === 'nudging') cycles++; };
const elements = { splash, 'turn-logo': logo, 'turn-track-fill': fill, 'turn-eyebrow': node(), 'turn-check': node() };
const document = { visibilityState: 'visible', readyState: 'complete', querySelector: () => strip,
  getElementById: id => elements[id] };
vm.runInNewContext(timeline, { document, getComputedStyle: e => e.style,
  window: { innerHeight: 800, innerWidth: 1200, addEventListener() {} },
  performance: { now: () => now }, requestAnimationFrame: fn => raf.push(fn) });
function advance(ms) { for(let i=0;i<ms;i+=20) { now+=20; raf.splice(0).forEach(fn=>fn(now)); } }
advance(2000); assert.equal(cycles, 0, 'Wait for splash');
splash.style.display = 'none'; advance(480); assert.equal(cycles, 0, 'Keep original visibility hold');
advance(80); assert.equal(cycles, 1, 'Start without header animation');
advance(12000); assert.equal(cycles, 1, 'Timeline plays once');
console.log('PASS: original static lockup, fixed gold underline, no header animation or dependency, silent splash, independent once-only timeline.');
