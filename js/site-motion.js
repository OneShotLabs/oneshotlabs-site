(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const isHome = Boolean(document.querySelector('.decision-cube-hero'));
  body.classList.toggle('site-motion-home', isHome);
  root.classList.add('site-motion-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('is-site-settled')));

  document.querySelectorAll('.instrument .territories button').forEach((button, index) => {
    button.style.setProperty('--motion-index', index);
    button.style.setProperty('--motion-delay', `${index * 55}ms`);
    button.style.setProperty('--motion-delay-mobile', `${index * 35}ms`);
  });
  document.querySelectorAll('.contact-form').forEach(form => {
    form.querySelectorAll('.form-row').forEach((row, index) => {
      row.style.setProperty('--motion-index', index);
      row.style.setProperty('--motion-delay', `${80 + index * 70}ms`);
    });
  });

  const targets = isHome ? [] : [...new Set(
    document.querySelectorAll('.instrument, .capability-horizon, body > section:not(.hero):not(.decision-cube-hero), .site-footer')
  )];
  targets.forEach(target => target.classList.add('site-motion-target'));

  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-motion-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .11, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(target => observer.observe(target));
  } else {
    targets.forEach(target => target.classList.add('is-motion-visible'));
  }

  const numberPhotoItems = () => {
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
      item.style.setProperty('--motion-index', index % 4);
    });
  };
  numberPhotoItems();
  const photoTimeline = document.getElementById('photo-timeline');
  if (photoTimeline && 'MutationObserver' in window) {
    new MutationObserver(numberPhotoItems).observe(photoTimeline, { childList: true });
  }

})();
