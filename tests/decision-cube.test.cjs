const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = readFileSync(join(__dirname, '../js/decision-cube.js'), 'utf8');
function setup({ splashVisible = true, reduced = false, loaded = true } = {}) {
  let now = 0, sequence = 0, observer;
  const timers = new Map(), events = {}, documentEvents = {}, messages = [];
  const frame = { contentWindow: { postMessage: message => messages.push(message.action) } };
  const splash = { display: splashVisible ? 'block' : 'none' };
  const heading = {}, toggle = { addEventListener: (_, callback) => toggle.click = callback };
  const nodes = { 'decision-cube-frame': frame, 'decision-cube-heading': heading, 'decision-cube-toggle': toggle, splash };
  const document = { readyState: loaded ? 'complete' : 'loading', visibilityState: 'visible', getElementById: id => nodes[id], addEventListener: (name, callback) => documentEvents[name] = callback };
  vm.runInNewContext(code, {
    document, window: { addEventListener: (name, callback) => events[name] = callback },
    matchMedia: () => ({ matches: reduced }), getComputedStyle: node => node,
    requestAnimationFrame: callback => callback(),
    MutationObserver: class { constructor(callback) { observer = callback; } observe() {} },
    setTimeout: (callback, delay) => { const id = ++sequence; timers.set(id, { callback, due: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const state = name => events.message({ source: frame.contentWindow, data: { type: 'oneshot:cube-state', state: name } });
  const advance = elapsed => { now += elapsed; for (const [id, timer] of timers) if (timer.due <= now) { timers.delete(id); timer.callback(); } };
  return { messages, state, advance, heading, toggle, document, events, documentEvents, reveal() { splash.display = 'none'; observer(); } };
}
let t = setup(); t.state('ready'); t.advance(5000); assert.deepEqual(t.messages, []);
t.reveal(); t.advance(999); assert.deepEqual(t.messages, []); t.advance(1); assert.deepEqual(t.messages, ['start']);
t.state('solved'); assert.equal(t.heading.innerHTML, 'Intelligence for What’s <em>Next.</em>');
t.state('complete'); assert.equal(t.toggle.textContent, 'Replay animation');
t.toggle.click(); assert.equal(t.messages.at(-1), 'start');
t = setup({ splashVisible: false, loaded: false }); t.state('ready'); t.advance(3000); assert.deepEqual(t.messages, []);
t.events.load(); t.advance(1000); assert.deepEqual(t.messages, ['start']);
t = setup({ splashVisible: false }); t.state('ready'); t.advance(999); t.document.visibilityState = 'hidden'; t.documentEvents.visibilitychange(); t.advance(3000); assert.deepEqual(t.messages, []);
t.document.visibilityState = 'visible'; t.documentEvents.visibilitychange(); t.advance(1000); assert.deepEqual(t.messages, ['start']);
t = setup({ splashVisible: false, reduced: true }); t.state('ready'); t.advance(5000); assert.deepEqual(t.messages, ['finish']);
t = setup({ splashVisible: false }); t.events.message({ source: {}, data: { type: 'oneshot:cube-state', state: 'ready' } }); t.advance(3000); assert.deepEqual(t.messages, []);
console.log('Cube timing, splash gating, visibility, reduced motion, replay, and message isolation passed.');
