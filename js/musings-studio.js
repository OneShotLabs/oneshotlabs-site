// Musings · Studio: play films in an on-page player instead of leaving the index.
// Any element with .film-play and data-film-src opens the player; the film page link stays available for sharing.
(() => {
  let dialog, video, titleEl, lineEl, linkEl, opener;
  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'film-dialog';
    dialog.setAttribute('aria-label', 'Film player');
    dialog.innerHTML = `
      <button class="film-dialog-close" type="button" aria-label="Close film"></button>
      <video controls playsinline preload="none"></video>
      <div class="film-dialog-bar">
        <div><h2 class="film-dialog-title"></h2><p class="film-dialog-line"></p></div>
        <a class="film-dialog-link" href="#">Open the film page ↗</a>
      </div>`;
    document.body.appendChild(dialog);
    video = dialog.querySelector('video');
    titleEl = dialog.querySelector('.film-dialog-title');
    lineEl = dialog.querySelector('.film-dialog-line');
    linkEl = dialog.querySelector('.film-dialog-link');
    dialog.querySelector('.film-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      video.pause(); video.removeAttribute('src'); video.load();
      opener?.focus();
      runReel();
    });
  }
  function open(btn) {
    if (!dialog) build();
    opener = btn;
    const d = btn.dataset;
    titleEl.textContent = d.filmTitle || '';
    lineEl.textContent = d.filmLine || '';
    linkEl.href = d.filmHref || '/musings';
    video.poster = d.filmPoster || '';
    video.src = d.filmSrc;
    reel?.pause();
    dialog.showModal();
    video.play().catch(() => {});
  }
  // Studio banner: the silent reel loops unless the viewer prefers reduced motion; it rests while a film is open.
  const reel = document.querySelector('#studio .studio-reel');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const runReel = () => { if (reel && !still.matches && !(dialog && dialog.open)) reel.play().catch(() => {}); };
  if (reel) { runReel(); still.addEventListener('change', () => (still.matches ? reel.pause() : runReel())); }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.film-play[data-film-src]');
    if (!btn) return;
    e.preventDefault();
    open(btn);
  });
})();
