const CHAPTERS = Object.freeze([
  { time: 0, key: 'inputs', label: '01 INPUTS', copy: 'Evidence arrives across property, market, operations, capital and debt.' },
  { time: 3.5, key: 'connect', label: '02 CONNECT', copy: 'Assumptions connect, making the logic of the opportunity visible.' },
  { time: 8.2, key: 'verify', label: '03 VERIFY', copy: 'Verified signals clarify risk without obscuring judgment.' },
  { time: 12.5, key: 'judgment', label: '04 JUDGMENT', copy: 'Structured intelligence advances the decision with confidence.' }
]);

document.querySelector('#app').innerHTML = `
  <section class="hero" data-phase="inputs" aria-label="OneShotLabs real estate intelligence">
    <div class="ambient" aria-hidden="true"></div>
    <div class="composition">
      <div class="editorial">
        <h1><span>Real Estate Expertise.</span><br><em>Frontier Intelligence.</em></h1>
        <div class="phase-copy" aria-live="polite">
          ${CHAPTERS.map((chapter) => `<p data-copy="${chapter.key}">${chapter.copy}</p>`).join('')}
        </div>
      </div>
      <div class="visual">
        <figure class="diorama-figure">
          <div class="hero-diorama">
            <video class="diorama-film" muted playsinline preload="auto" aria-label="Architectural investment intelligence diorama">
              <source src="OneShotLabs_AI_hero_Web_Final.mp4" type="video/mp4">
            </video>
          </div>
        </figure>
      </div>
    </div>
    <nav class="timeline" aria-label="Animation chapters">
      <div class="timeline-labels">
        ${CHAPTERS.map((chapter) => `<button type="button" data-chapter="${chapter.key}" data-jump="${chapter.time}">${chapter.label}</button>`).join('')}
      </div>
      <i aria-hidden="true"></i>
    </nav>
    <button class="pause" type="button" aria-pressed="false">PAUSE</button>
  </section>`;

const hero = document.querySelector('.hero');
const film = document.querySelector('.diorama-film');
const pauseButton = document.querySelector('.pause');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const FINAL_HOLD_TIME = 17.6;
let duration = 18;
let finalHoldLocked = false;

function phaseAt(time) {
  if (time < 3.5) return 'inputs';
  if (time < 8.2) return 'connect';
  if (time < 12.5) return 'verify';
  return 'judgment';
}

function paint(frameTime = film.currentTime) {
  const time = Number.isFinite(frameTime) ? frameTime : 0;
  hero.dataset.phase = phaseAt(time);
  const stops = [0, 3.5, 8.2, 12.5, duration];
  let segment = stops.length - 2;
  for (let index = 0; index < stops.length - 1; index += 1) {
    if (time < stops[index + 1]) {
      segment = index;
      break;
    }
  }
  const start = stops[segment];
  const end = stops[segment + 1];
  const withinSegment = Math.min(1, Math.max(0, (time - start) / Math.max(.001, end - start)));
  const progress = ((segment + withinSegment) / (stops.length - 1)) * 100;
  hero.style.setProperty('--progress', `${Math.min(100, progress)}%`);

  if (!finalHoldLocked && film.currentTime >= FINAL_HOLD_TIME) {
    finalHoldLocked = true;
    film.pause();
    film.currentTime = FINAL_HOLD_TIME;
    hero.dataset.phase = 'judgment';
    hero.style.setProperty('--progress', '100%');
    pauseButton.textContent = 'REPLAY';
    pauseButton.setAttribute('aria-pressed', 'true');
  }
}

function setPaused(paused) {
  if (paused) film.pause();
  else film.play().catch(() => {});
  pauseButton.textContent = paused ? 'PLAY' : 'PAUSE';
  pauseButton.setAttribute('aria-pressed', String(paused));
}

film.addEventListener('loadedmetadata', () => {
  duration = film.duration || 18;
  if (reduceMotion.matches) {
    finalHoldLocked = true;
    film.currentTime = FINAL_HOLD_TIME;
    film.pause();
    hero.dataset.phase = 'judgment';
    hero.style.setProperty('--progress', '100%');
    pauseButton.textContent = 'REPLAY';
    pauseButton.setAttribute('aria-pressed', 'true');
  } else {
    film.play().catch(() => setPaused(true));
  }
});

film.addEventListener('timeupdate', paint);
film.addEventListener('seeked', paint);

if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
  const syncToVideoFrame = () => {
    film.requestVideoFrameCallback((_, metadata) => {
      paint(metadata.mediaTime);
      syncToVideoFrame();
    });
  };
  syncToVideoFrame();
}
film.addEventListener('ended', () => {
  finalHoldLocked = true;
  film.currentTime = FINAL_HOLD_TIME;
  hero.dataset.phase = 'judgment';
  hero.style.setProperty('--progress', '100%');
  pauseButton.textContent = 'REPLAY';
  pauseButton.setAttribute('aria-pressed', 'true');
});

pauseButton.addEventListener('click', () => {
  if (finalHoldLocked || film.ended || film.currentTime >= duration - 0.05) {
    finalHoldLocked = false;
    film.currentTime = 0;
    film.play().catch(() => {});
    pauseButton.textContent = 'PAUSE';
    pauseButton.setAttribute('aria-pressed', 'false');
    return;
  }
  setPaused(!film.paused);
});

document.querySelectorAll('[data-jump]').forEach((button) => {
  button.addEventListener('click', () => {
    finalHoldLocked = false;
    film.currentTime = Number(button.dataset.jump);
    film.play().catch(() => setPaused(true));
    setPaused(false);
  });
});
