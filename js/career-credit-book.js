(() => {
  const root = document.querySelector('[data-credit-book]');
  if (!root) return;

  const shell = root.querySelector('.credit-book-shell');
  const sections = [...root.querySelectorAll('.credit-book-section')];
  const counters = [...root.querySelectorAll('.credit-count')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setSection = (section, open) => {
    const button = section.querySelector('.credit-book-button');
    section.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  };

  sections.forEach((section) => {
    const button = section.querySelector('.credit-book-button');
    button.addEventListener('click', () => {
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      sections.forEach((candidate) => setSection(candidate, candidate === section && willOpen));
    });
  });

  const renderValue = (node, value) => {
    const decimals = Number(node.dataset.decimals || 0);
    const prefix = node.dataset.prefix || '';
    const suffix = node.dataset.suffix || '';
    const formatted = decimals
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US');
    node.textContent = `${prefix}${formatted}${suffix}`;
  };

  const reveal = () => {
    shell.classList.remove('is-preparing');
    shell.classList.add('is-visible');

    counters.forEach((node, index) => {
      const target = Number(node.dataset.value || 0);
      if (reducedMotion) {
        renderValue(node, target);
        return;
      }

      const duration = 950;
      const startTime = performance.now() + 100 + index * 90;
      const tick = (now) => {
        const progress = Math.min(1, Math.max(0, (now - startTime) / duration));
        const eased = 1 - Math.pow(1 - progress, 4);
        renderValue(node, target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  if (reducedMotion) {
    reveal();
    return;
  }

  shell.classList.add('is-preparing');
  counters.forEach((node) => renderValue(node, 0));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      reveal();
    }, { threshold: 0.18 });
    observer.observe(root);
  } else {
    reveal();
  }
})();
