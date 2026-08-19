// Lightweight DIY momentum smooth-scroll — no external library.
// A fixed-position wrapper is translated toward the real (native) scroll
// position with a lerp each frame; a spacer div gives the document real
// scrollable height so the native scrollbar, keyboard nav, and anchor
// links keep working normally. Sticky header and fixed UI stay outside
// the wrapper so their own positioning is untouched.
(() => {
  const wrapper = document.getElementById("smooth-wrapper");
  const spacer = document.getElementById("smooth-spacer");
  if (!wrapper || !spacer) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let current = window.scrollY;
  let target = window.scrollY;
  const ease = 0.09;

  function resize() {
    spacer.style.height = wrapper.getBoundingClientRect().height + "px";
  }

  function onScroll() {
    target = window.scrollY;
  }

  function tick() {
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.05) current = target;
    wrapper.style.transform = `translate3d(0, ${-current}px, 0)`;
    requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener("load", resize);

  // Recompute after fonts/images settle and whenever content height changes.
  new ResizeObserver(resize).observe(wrapper);
  resize();
  requestAnimationFrame(tick);

  // Subtle parallax on the hero visual panel, driven by the same scroll value.
  const parallaxEl = document.getElementById("hero-parallax");
  if (parallaxEl) {
    function parallax() {
      const rect = parallaxEl.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (progress - 0.5) * 24; // +/-12px drift
      parallaxEl.style.transform = `translate3d(0, ${offset}px, 0)`;
      requestAnimationFrame(parallax);
    }
    requestAnimationFrame(parallax);
  }
})();
