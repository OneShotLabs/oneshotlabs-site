/* The supplied ProRes artwork, losslessly converted to a one-play APNG.
   Its first settled frame is at 820ms (340ms old draw + 480ms old glow).
   The final frame remains displayed; no loop, CSS glow, or second logo. */
(() => {
  const link = document.querySelector('.site-header a.logo');
  if (!link) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stillUrl = 'assets/brand/header-commanding-still.png';
  const motionUrl = 'assets/brand/header-commanding.png';
  let motionBlob = null;
  let objectUrl = null;
  let started = false;
  const art = new Image();
  art.className = 'header-brand-art';
  art.alt = '';
  art.setAttribute('aria-hidden', 'true');
  link.setAttribute('aria-label', 'OneShotLabs home');
  link.classList.add('header-brand');
  art.addEventListener('load', () => link.classList.add('is-brand-ready'));
  art.addEventListener('error', () => {
    if (art.getAttribute('src') !== stillUrl) art.src = stillUrl;
    else link.classList.remove('is-brand-ready');
  });
  art.src = stillUrl;
  link.appendChild(art);

  // Fetch bytes, not an image element: preloading must not start animation
  // behind the opening splash. Slow/offline loads retain the settled logo
  // rather than starting the animation late or showing a broken image.
  let seen = false;
  try { seen = !!sessionStorage.getItem('oneshot-header-underline-draw-seen'); }
  catch { /* Storage restrictions must not hide the brand. */ }
  if (!reduced.matches && !seen) {
    fetch(motionUrl).then(response => {
      if (!response.ok) throw new Error('Brand animation unavailable');
      return response.blob();
    }).then(blob => { motionBlob = blob; }).catch(() => {});
  }

  function start() {
    if (started || reduced.matches) return;
    started = true;
    if (!motionBlob) return;
    objectUrl = URL.createObjectURL(motionBlob);
    art.src = objectUrl;
  }
  window.addEventListener('oneshot:header-brand-start', start, { once: true });
  reduced.addEventListener('change', () => {
    if (reduced.matches) art.src = stillUrl;
  });
  window.addEventListener('pagehide', () => {
    art.src = stillUrl;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });
})();
