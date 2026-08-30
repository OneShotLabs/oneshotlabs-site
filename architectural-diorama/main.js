const LAYERS = Object.freeze([
  { key: 'PROPERTY', detail: 'Physical condition · tenancy · basis', kind: 'glass' },
  { key: 'MARKET', detail: 'Demand · supply · comparable evidence', kind: 'paper' },
  { key: 'OPERATIONS', detail: 'Revenue · expenses · execution', kind: 'navy' },
  { key: 'CAPITAL', detail: 'Business plan · reserves · returns', kind: 'paper' },
  { key: 'DEBT', detail: 'Sizing · coverage · covenants', kind: 'brass' }
]);

document.querySelector('#app').innerHTML = `
  <section class="hero" data-phase="inputs" aria-label="OneShotLabs AI turns fragmented real estate evidence into investment judgment">
    <div class="ambient" aria-hidden="true"></div>
    <div class="editorial">
      <p class="eyebrow">ONESHOTLABS AI</p>
      <h1>Real estate intelligence,<br><em>made visible.</em></h1>
      <p class="intro">Transform fragmented property, market, capital and operating data into a coherent investment strategy.</p>
      <a class="action" href="../contact.html" target="_parent">EXPLORE THE APPROACH</a>
      <p class="principle"><span></span> Built by real estate expertise. Accelerated by frontier intelligence.</p>
    </div>

    <div class="visual" aria-label="Architectural information diorama">
      <div class="camera">
        <div class="plinth"><i></i></div>
        <div class="stack">
          ${LAYERS.map((layer, i) => `
            <article class="layer ${layer.kind} l${i + 1}">
              <i class="edge"></i>
              <div class="engraving"><b>${layer.key}</b><span>${layer.detail}</span><i></i><i></i><i></i></div>
              ${i === 0 ? '<span class="verified v1">VERIFIED</span><span class="verified v2">VERIFIED</span>' : ''}
              ${i === 2 ? '<span class="judgment">JUDGMENT</span>' : ''}
            </article>`).join('')}
          <svg class="rays" viewBox="0 0 620 620" aria-hidden="true">
            <path d="M120 500 L120 115"/><path d="M255 525 L255 92"/><path d="M410 515 L410 128"/><path d="M525 490 L525 105"/>
            <circle cx="120" cy="220" r="5"/><circle cx="255" cy="330" r="5"/><circle cx="410" cy="185" r="5"/><circle cx="525" cy="390" r="5"/>
          </svg>
          <div class="summary">
            <header><small>INVESTMENT INTELLIGENCE</small><strong>Decision Framework</strong></header>
            <div class="summary-grid"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div class="summary-verdict"><span>STRATEGY</span><b>DECISION-READY</b></div>
            <footer><b>SOURCE LOGIC — RECONCILED</b><span>Evidence retained · Judgment elevated</span></footer>
          </div>
        </div>
      </div>
      <div class="phase-copy" aria-live="polite">
        <p data-copy="inputs"><b>FRAGMENTED INPUTS</b><span>Property · Market · Operations · Capital · Debt</span></p>
        <p data-copy="connect"><b>ASSUMPTIONS CONNECTED</b><span>Dependencies become visible.</span></p>
        <p data-copy="verify"><b>SIGNAL VERIFIED</b><span>Risk elevated for judgment.</span></p>
        <p data-copy="judgment"><b>FROM INFORMATION TO JUDGMENT</b><span>Institutional real estate intelligence.</span></p>
      </div>
    </div>

    <nav class="timeline" aria-label="Animation chapters">
      <button data-jump="0">01 INPUTS</button><button data-jump="3.5">02 CONNECT</button><button data-jump="8">03 VERIFY</button><button data-jump="12.5">04 JUDGMENT</button><i></i>
    </nav>
    <button class="pause" aria-pressed="false">PAUSE</button>
  </section>`;

const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const duration = 16;
let start = performance.now();
let paused = reduce.matches;
let pausedAt = reduce.matches ? 14 : 0;

function phaseAt(t) {
  if (t < 3.5) return 'inputs';
  if (t < 8) return 'connect';
  if (t < 12.5) return 'verify';
  return 'judgment';
}

function paint(t) {
  hero.dataset.phase = phaseAt(t);
  hero.style.setProperty('--progress', `${(t / duration) * 100}%`);
}

function frame(now) {
  const t = paused ? pausedAt : ((now - start) / 1000) % duration;
  paint(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function setPaused(value) {
  if (value === paused) return;
  if (value) pausedAt = ((performance.now() - start) / 1000) % duration;
  else start = performance.now() - pausedAt * 1000;
  paused = value;
  const button = document.querySelector('.pause');
  button.textContent = paused ? 'PLAY' : 'PAUSE';
  button.setAttribute('aria-pressed', String(paused));
}

document.querySelector('.pause').addEventListener('click', () => setPaused(!paused));
document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
  setPaused(true);
  pausedAt = Number(button.dataset.jump);
  paint(pausedAt);
}));
