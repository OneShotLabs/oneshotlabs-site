const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/homepage-intro.js'), 'utf8');

function intro({ reduced = false, seen = false } = {}) {
  const timers = new Map();
  const events = {};
  let nextId = 0;
  const document = { activeElement: null, addEventListener: (name, fn) => { events[name] = fn; } };
  const element = () => ({ style: {}, hidden: true, inert: false, classList: { add() {}, remove() {} },
    append() {}, addEventListener(name, fn) { this[name] = fn; }, focus() { document.activeElement = this; } });
  const ids = Object.fromEntries(['splash', 'intro-skip', 'smooth-wrapper', 'splash-quote', 'splash-quote-stage', 'launch-film-heading'].map(id => [id, element()]));
  const header = element();
  document.body = element();
  document.documentElement = element();
  document.getElementById = id => ids[id];
  document.querySelector = selector => selector === '.site-header' ? header : selector === '#smooth-wrapper' ? ids['smooth-wrapper'] : element();
  document.createElement = element;
  const storage = new Map(seen ? [['oneshot-splash-seen', '1']] : []);
  vm.runInNewContext(source, { document, Set,
    window: { matchMedia: () => ({ matches: reduced }), setTimeout: fn => { timers.set(++nextId, fn); return nextId; } },
    clearTimeout: id => timers.delete(id),
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  });
  return { ids, header, document, events, timers };
}

test('skipping cancels the intro and restores page access and focus', () => {
  const h = intro();
  assert.equal(h.ids['intro-skip'].hidden, false);
  assert.equal(h.header.inert, true);
  assert.ok(h.timers.size > 0);
  h.ids['intro-skip'].click();
  assert.equal(h.timers.size, 0);
  assert.equal(h.ids.splash.style.display, 'none');
  assert.equal(h.ids['intro-skip'].hidden, true);
  assert.equal(h.header.inert, false);
  assert.equal(h.ids['smooth-wrapper'].inert, false);
  assert.equal(h.document.activeElement, h.ids['launch-film-heading']);
});

test('Escape dismisses the intro without waiting for its timers', () => {
  const h = intro();
  let prevented = false;
  h.events.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(h.timers.size, 0);
  assert.equal(h.ids.splash.style.display, 'none');
});

for (const options of [{ reduced: true }, { seen: true }]) {
  test(`intro is bypassed for ${options.reduced ? 'reduced motion' : 'repeat visits'}`, () => {
    const h = intro(options);
    assert.equal(h.timers.size, 0);
    assert.equal(h.ids.splash.style.display, 'none');
    assert.equal(h.ids['intro-skip'].hidden, true);
    assert.equal(h.header.inert, false);
  });
}
