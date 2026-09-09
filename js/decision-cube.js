(() => {
  const frame = document.getElementById('decision-cube-frame');
  const heading = document.getElementById('decision-cube-heading');
  const toggle = document.getElementById('decision-cube-toggle');
  const splash = document.getElementById('splash');
  if (!frame || !heading || !toggle) return;
  let ready = false, loaded = document.readyState === 'complete';
  let started = false, running = false, complete = false, timer = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const send = action => frame.contentWindow?.postMessage({ type: 'oneshot:cube', action }, '*');
  const visible = () => document.visibilityState === 'visible' && (!splash || getComputedStyle(splash).display === 'none');
  const cancel = () => { clearTimeout(timer); timer = null; };
  function start() {
    if (!ready || !loaded || !visible()) return;
    started = true; running = true; complete = false;
    heading.innerHTML = 'Complexity, organized for <em>judgment.</em>';
    toggle.textContent = 'Pause animation'; toggle.disabled = false;
    send('start');
  }
  function schedule() {
    if (started || reduced || !ready || !loaded || !visible()) { cancel(); return; }
    if (timer !== null) return;
    // Start only after the uncovered document has painted, then wait one second.
    timer = setTimeout(() => { timer = null; start(); }, 1000);
  }
  function afterPaint() { requestAnimationFrame(() => requestAnimationFrame(schedule)); }
  window.addEventListener('load', () => { loaded = true; afterPaint(); }, { once: true });
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.data?.type !== 'oneshot:cube-state') return;
    if (event.data.state === 'ready') {
      ready = true;
      if (reduced) { send('finish'); started = true; }
      afterPaint();
    }
    if (event.data.state === 'complete') {
      running = false; complete = true;
      heading.textContent = 'Intelligence for What’s Next.';
      toggle.textContent = 'Replay animation'; toggle.disabled = false;
    }
  });
  toggle.addEventListener('click', () => {
    if (!ready) return;
    cancel();
    if (complete) { start(); return; }
    if (running) { send('pause'); running = false; toggle.textContent = 'Resume animation'; }
    else { send('start'); running = true; toggle.textContent = 'Pause animation'; }
  });
  document.addEventListener('visibilitychange', () => {
    if (!visible()) {
      cancel();
      if (running) { send('pause'); running = false; toggle.textContent = 'Resume animation'; }
    } else afterPaint();
  });
  if (splash) new MutationObserver(afterPaint).observe(splash, { attributes: true, attributeFilter: ['style', 'class'] });
  afterPaint();
})();
