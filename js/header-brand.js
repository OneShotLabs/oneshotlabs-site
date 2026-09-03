/* Supplied artwork in 42 lossless frames. Explicit frame playback avoids
   APNG autoplay/cache ambiguity. Frame 41 settles at 820ms, then releases
   the timeline. No artwork, layout, or motion-speed changes. */
(() => {
  const link = document.querySelector('.site-header a.logo');
  if (!link) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const splash = document.getElementById('splash');
  const stillUrl = 'assets/brand/header-commanding-still.png';
  const startUrl = 'assets/brand/header-commanding-start.png';
  const WIDTH = 948, HEIGHT = 182, COLUMNS = 7, LAST_FRAME = 41;
  const FRAME_MS = 20, DURATION = LAST_FRAME * FRAME_MS;
  let requested = false, started = false, completed = false;
  let ready = false, failed = false, scheduled = false;
  let elapsed = 0, previousTime = null;

  const art = new Image();
  art.className = 'header-brand-art';
  art.alt = '';
  art.setAttribute('aria-hidden', 'true');
  link.setAttribute('aria-label', 'OneShotLabs home');
  link.classList.add('header-brand');
  art.addEventListener('load', () => link.classList.add('is-brand-ready'));
  art.src = reduced.matches ? stillUrl : startUrl;
  link.appendChild(art);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.className = 'header-brand-art';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'none';
  link.appendChild(canvas);
  const context = canvas.getContext('2d');
  const frames = new Image();

  function draw(frame) {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.drawImage(frames, (frame % COLUMNS) * WIDTH,
      Math.floor(frame / COLUMNS) * HEIGHT, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);
    canvas.style.display = 'block';
    art.style.display = 'none';
    link.classList.add('is-brand-ready');
  }
  function finish() {
    if (completed) return;
    completed = true;
    if (ready && context) draw(LAST_FRAME);
    else { art.src = stillUrl; art.style.display = 'block'; }
    window.dispatchEvent(new Event('oneshot:header-brand-complete'));
  }
  function visible() {
    if (document.visibilityState !== 'visible' || document.readyState !== 'complete') return false;
    if (splash && getComputedStyle(splash).display !== 'none') return false;
    const r = link.getBoundingClientRect();
    const style = getComputedStyle(link);
    return style.visibility === 'visible' && Number(style.opacity) > 0 &&
      r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }
  function tick(now) {
    if (completed) return;
    if (!visible()) { previousTime = null; requestAnimationFrame(tick); return; }
    if (previousTime !== null) elapsed += now - previousTime;
    previousTime = now;
    draw(Math.min(LAST_FRAME, Math.floor(elapsed / FRAME_MS)));
    if (elapsed >= DURATION) requestAnimationFrame(finish);
    else requestAnimationFrame(tick);
  }
  function scheduleStart() {
    if (!requested || started || completed || scheduled || !visible()) return;
    if (reduced.matches || failed) { finish(); return; }
    if (!ready) return;
    scheduled = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scheduled = false;
      if (!visible() || completed) return;
      started = true;
      draw(0);
      requestAnimationFrame(tick);
    }));
  }
  frames.addEventListener('load', () => {
    if (!context) { failed = true; scheduleStart(); return; }
    ready = true;
    draw(completed || reduced.matches ? LAST_FRAME : 0);
    scheduleStart();
  });
  frames.addEventListener('error', () => { failed = true; scheduleStart(); });
  frames.src = 'assets/brand/header-commanding-frames.png';
  window.addEventListener('oneshot:header-brand-request', () => {
    requested = true;
    scheduleStart();
  });
  window.addEventListener('load', scheduleStart);
  window.addEventListener('pageshow', scheduleStart);
  window.addEventListener('scroll', scheduleStart, { passive: true });
  document.addEventListener('visibilitychange', () => {
    previousTime = null;
    scheduleStart();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches && requested) finish();
    else scheduleStart();
  });
})();
