(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.decision-cube-hero');
  const frame = document.getElementById('decision-cube-frame');
  const footer = document.querySelector('.site-footer');

  root.classList.add('motion-ready');

  // Give each paragraph a quiet 60ms cadence inside its editorial group.
  document.querySelectorAll('.founder-note-inner').forEach(group => {
    group.querySelectorAll('.reveal').forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 60}ms`);
    });
  });

  const sectionTargets = [document.querySelector('.founder-note'), footer].filter(Boolean);
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-motion-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -9% 0px' });
    sectionTargets.forEach(section => observer.observe(section));
  } else {
    sectionTargets.forEach(section => section.classList.add('is-motion-visible'));
  }

  if (!hero || !frame || reduced.matches) return;

  let ticking = false;
  let lastProgress = -1;
  const clamp = value => Math.max(0, Math.min(1, value));

  const updateHandoff = () => {
    ticking = false;
    const start = innerHeight * .87;
    const distance = Math.max(innerHeight * .42, 320);
    const heroBottom = hero.offsetTop + hero.offsetHeight - scrollY;
    const progress = clamp((start - heroBottom) / distance);
    if (Math.abs(progress - lastProgress) < .003) return;

    lastProgress = progress;
    hero.style.setProperty('--cube-handoff', progress.toFixed(3));
    hero.classList.toggle('is-handing-off', progress > .68);
    frame.contentWindow?.postMessage({ type: 'oneshot:cube', action: 'handoff', progress }, '*');
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHandoff);
  };

  updateHandoff();
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  reduced.addEventListener?.('change', requestUpdate);
})();
