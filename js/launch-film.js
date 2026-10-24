(() => {
  const hero = document.querySelector('.launch-film-hero');
  const splash = document.getElementById('splash');
  let revealed = false;
  function reveal() {
    if (revealed || (splash && getComputedStyle(splash).display !== 'none')) return;
    revealed = true;
    hero.classList.add('hero-arriving');
  }
  if (splash) new MutationObserver(reveal).observe(splash,{attributes:true,attributeFilter:['style','class']});
  reveal();
  const watch = document.getElementById('launch-film-watch');
  const dialog = document.getElementById('launch-film-dialog');
  const close = document.getElementById('launch-film-dialog-close');
  const video = document.getElementById('launch-film-full');
  watch.addEventListener('click', () => {
    dialog.showModal();
    video.play().catch(() => {});
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if(event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {video.pause();watch.focus();});
})();
