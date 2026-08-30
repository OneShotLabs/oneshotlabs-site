const LAYERS = Object.freeze([
  { key: 'PROPERTY', detail: 'Physical condition · tenancy · basis', kind: 'glass' },
  { key: 'MARKET', detail: 'Demand · supply · comparable evidence', kind: 'paper' },
  { key: 'OPERATIONS', detail: 'Revenue · expenses · execution', kind: 'navy' },
  { key: 'CAPITAL', detail: 'Business plan · reserves · returns', kind: 'paper' },
  { key: 'DEBT', detail: 'Sizing · coverage · covenants', kind: 'brass' }
]);

document.querySelector('#app').innerHTML = `
  <section class="hero" data-phase="inputs" aria-label="OneShotLabs turns fragmented real estate evidence into investment judgment">
    <video class="diorama-film" muted playsinline preload="auto" aria-hidden="true">
      <source src="OneShotLabs-Diorama-Master-16s.mp4" type="video/mp4">
    </video>
    <div class="ambient" aria-hidden="true"></div>
    <div class="decision-signals" aria-hidden="true">
      <span>STRATEGY ALIGNED</span><span>EVIDENCE RECONCILED</span><span>RISK ELEVATED</span><b>JUDGMENT READY</b>
    </div>
    <div class="seal-surface" aria-hidden="true"></div>
    <div class="brand-seal" aria-hidden="true">
      <svg viewBox="0 0 800 800" role="presentation">
        <defs>
          <linearGradient id="seal-navy" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#263B5C" stop-opacity=".92"/><stop offset=".48" stop-color="#1D2F4E" stop-opacity=".8"/><stop offset="1" stop-color="#10213D" stop-opacity=".9"/></linearGradient>
          <linearGradient id="seal-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E2C98F" stop-opacity=".7"/><stop offset=".5" stop-color="#C5A059" stop-opacity=".82"/><stop offset="1" stop-color="#8F6B2F" stop-opacity=".68"/></linearGradient>
          <filter id="seal-texture" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="3" seed="17" result="grain"/><feColorMatrix in="grain" type="saturate" values="0" result="mono-grain"/><feComposite in="mono-grain" in2="SourceAlpha" operator="in" result="masked-grain"/><feDisplacementMap in="SourceGraphic" in2="mono-grain" scale="1.1" result="pressed"/><feBlend in="pressed" in2="masked-grain" mode="multiply"/></filter>
        </defs>
        <g class="seal-star" fill="url(#seal-navy)" filter="url(#seal-texture)">
          <polygon style="--i:0" points="407,404 383,325 418,270 424,329"/>
          <polygon style="--i:1" points="413,407 452,333 516,319 484,361"/>
          <polygon style="--i:2" points="414,411 496,388 550,423 496,429"/>
          <polygon style="--i:3" points="412,417 488,457 501,520 460,488"/>
          <polygon style="--i:4" points="407,420 432,499 398,555 392,502"/>
          <polygon style="--i:5" points="402,417 364,493 300,506 334,463"/>
          <polygon style="--i:6" points="399,412 321,438 266,402 321,397"/>
          <polygon style="--i:7" points="401,407 328,368 315,305 357,337"/>
        </g>
        <g class="seal-corners" fill="none" stroke="url(#seal-gold)" stroke-width="10" stroke-linecap="round" filter="url(#seal-texture)">
          <path d="M302 282 A24 24 0 0 0 278 306"/><path d="M515 282 A24 24 0 0 1 539 306"/>
          <path d="M278 520 A24 24 0 0 0 302 544"/><path d="M539 520 A24 24 0 0 1 515 544"/>
        </g>
      </svg>
    </div>
    <div class="editorial">
      <p class="eyebrow">ONESHOTLABS</p>
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
const film = document.querySelector('.diorama-film');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const duration = 18;
const filmHold = 14.4;
let start = performance.now();
let paused = reduce.matches;
let pausedAt = reduce.matches ? 16 : 0;
let previousT = 0;

function phaseAt(t) {
  if (t < 3.5) return 'inputs';
  if (t < 8) return 'connect';
  if (t < 12.5) return 'verify';
  return 'judgment';
}

function paint(t) {
  hero.dataset.phase = phaseAt(t);
  hero.style.setProperty('--progress', `${(t / duration) * 100}%`);
  const blankIn = Math.max(0, Math.min(1, (t - 14.05) / 0.72));
  const blankOut = Math.max(0, Math.min(1, (t - 17.55) / 0.35));
  const sealIn = Math.max(0, Math.min(1, (t - 15.05) / 0.95));
  const sealOut = Math.max(0, Math.min(1, (t - 16.7) / 0.9));
  hero.style.setProperty('--seal', String(sealIn * (1 - sealOut)));
  hero.style.setProperty('--blank', String(blankIn * (1 - blankOut)));
  hero.style.setProperty('--seal-in', String(sealIn));
  hero.style.setProperty('--seal-out', String(sealOut));
}

function frame(now) {
  const t = paused ? pausedAt : ((now - start) / 1000) % duration;
  if (!paused && t < previousT) {
    film.currentTime = 0;
    film.play().catch(() => {});
  } else if (!paused && t >= filmHold && !film.paused) {
    film.currentTime = filmHold;
    film.pause();
  }
  previousT = t;
  paint(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function setPaused(value) {
  if (value === paused) return;
  if (value) pausedAt = ((performance.now() - start) / 1000) % duration;
  else start = performance.now() - pausedAt * 1000;
  paused = value;
  if (value) film.pause();
  else {
    film.currentTime = Math.min(pausedAt, filmHold);
    if (pausedAt < filmHold) film.play().catch(() => {});
  }
  const button = document.querySelector('.pause');
  button.textContent = paused ? 'PLAY' : 'PAUSE';
  button.setAttribute('aria-pressed', String(paused));
}

document.querySelector('.pause').addEventListener('click', () => setPaused(!paused));
document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
  setPaused(true);
  pausedAt = Number(button.dataset.jump);
  film.currentTime = Math.min(pausedAt, filmHold);
  paint(pausedAt);
}));

film.addEventListener('canplay', () => hero.classList.add('film-ready'), { once: true });
if (reduce.matches) {
  film.addEventListener('loadedmetadata', () => {
    film.currentTime = filmHold;
    film.pause();
  }, { once: true });
} else {
  film.play().catch(() => {});
}
