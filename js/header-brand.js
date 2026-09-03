/* The supplied ProRes artwork, losslessly converted to a one-play APNG.
   Its first settled frame is at 820ms (340ms old draw + 480ms old glow).
   The final frame remains displayed; no loop, CSS glow, or second logo. */
(() => {
  const link = document.querySelector('.site-header a.logo');
  if (!link) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const splash = document.getElementById('splash');
  const stillUrl = 'assets/brand/header-commanding-still.png';
  const motionUrl = 'assets/brand/header-commanding.png';
  let motionBlob = null;
  let objectUrl = null;
  let started = false;
  let scheduled = false;
  let loading = false;
  const art = new Image();
  art.className = 'header-brand-art';
  art.alt = '';
  art.setAttribute('aria-hidden', 'true');
  link.setAttribute('aria-label', 'OneShotLabs home');
  link.classList.add('header-brand');
  art.addEventListener('load', () => {
    link.classList.add('is-brand-ready');
    scheduleStart();
  });
  art.addEventListener('error', () => {
    if (art.getAttribute('src') !== stillUrl) art.src = stillUrl;
    else link.classList.remove('is-brand-ready');
  });
  art.src = stillUrl;
  link.appendChild(art);

  // Fetch bytes without starting APNG playback behind the splash.
  // No session flag: a prior visit or failed fetch must not suppress
  // this page's first visible reveal. Slow downloads remain pending.
  function loadMotion() {
    if (reduced.matches || started || loading) return;
    if (motionBlob) { scheduleStart(); return; }
    loading = true;
    fetch(motionUrl).then(response => {
      if (!response.ok) throw new Error('Brand animation unavailable');
      return response.blob();
    }).then(blob => {
      motionBlob = blob;
      scheduleStart();
    }).catch(() => {}).finally(() => { loading = false; });
  }

  function canStart() {
    if (started || reduced.matches || !motionBlob ||
        document.visibilityState !== 'visible' || document.readyState !== 'complete') return false;
    if (splash && getComputedStyle(splash).display !== 'none') return false;
    const rect = link.getBoundingClientRect();
    const style = getComputedStyle(link);
    return style.visibility === 'visible' && Number(style.opacity) > 0 &&
      rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 &&
      rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
  }

  function scheduleStart() {
    if (scheduled || !canStart()) return;
    scheduled = true;
    // Two frames allow the uncovered main page to paint before revealing.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scheduled = false;
      if (!canStart()) return;
      started = true;
      objectUrl = URL.createObjectURL(motionBlob);
      art.src = objectUrl;
      splashObserver?.disconnect();
      headerObserver.disconnect();
    }));
  }
  const splashObserver = splash ? new MutationObserver(scheduleStart) : null;
  splashObserver?.observe(splash, { attributes: true, attributeFilter: ['style', 'class'] });
  const headerObserver = new IntersectionObserver(scheduleStart, { threshold: 1 });
  headerObserver.observe(link);
  window.addEventListener('oneshot:header-brand-start', scheduleStart);
  window.addEventListener('load', scheduleStart, { once: true });
  window.addEventListener('pageshow', scheduleStart);
  document.addEventListener('visibilitychange', scheduleStart);
  window.addEventListener('online', loadMotion);
  reduced.addEventListener('change', () => {
    if (reduced.matches) art.src = stillUrl;
    else loadMotion();
  });
  window.addEventListener('pagehide', () => {
    art.src = stillUrl;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });
  loadMotion();
  scheduleStart();
})();
