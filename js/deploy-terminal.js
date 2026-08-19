(function () {
  var wrap = document.getElementById('deploy-terminal');
  if (!wrap) return;
  var inner = document.getElementById('dt-scroll-inner');
  if (!inner) return;
  var viewport = wrap.querySelector('.dt-scroll-viewport');

  var count = 0;
  var MAX_CYCLES = 3;
  var CYCLE_GAP = 1900; // extra pause after a cycle fully completes, before replay
  var DURATION = 9775; // total scroll-phase duration (ms) — 15% slower than the prior 8500ms
  var HOLD = 0.15; // fraction of DURATION before any scroll starts
  var SPEEDUP_AT = 0.20; // fraction of DURATION where the faster rate begins
  var SPEED_MULT = 1.75; // 75% faster than the base/normal scroll rate
  var RAMP_SPAN = 0.10; // fraction of DURATION over which the speed-up eases in
  var started = false;

  function smoothstep(a, b, x) {
    if (a === b) return x < a ? 0 : 1;
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // Position as a function of elapsed-time fraction u (0..1). Two reference
  // curves are blended together: a constant "normal" rate that would land
  // exactly on the bottom at u=1, and a rate 75% faster that reaches the
  // bottom well before u=1 and then holds there — which is what gives the
  // last few lines and the gold brand reveal their long, readable dwell
  // time. The blend weight eases in smoothly across RAMP_SPAN starting at
  // SPEEDUP_AT, so the acceleration itself reads as gradual, not a cut. The
  // fast curve itself is eased (not linear), so it decelerates into its
  // landing on the final line instead of running at a constant clip and
  // snapping to a stop.
  function scrollProgress(u) {
    if (u <= HOLD) return 0;
    var span = 1 - HOLD;
    var slowP = Math.min(1, (u - HOLD) / span);
    if (u <= SPEEDUP_AT) return slowP;
    var fastSpan = span / SPEED_MULT;
    var fastRaw = Math.min(1, (u - SPEEDUP_AT) / fastSpan);
    var fastP = easeOutCubic(fastRaw);
    var w = smoothstep(SPEEDUP_AT, SPEEDUP_AT + RAMP_SPAN, u);
    return slowP + (fastP - slowP) * w;
  }

  function play() {
    var distance = Math.max(0, inner.scrollHeight - viewport.clientHeight);
    inner.classList.remove('dt-playing');
    void inner.offsetWidth;
    inner.style.transform = 'translateY(0)';
    inner.classList.add('dt-playing');

    var t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      var u = Math.min(1, (now - t0) / DURATION);
      var p = scrollProgress(u);
      inner.style.transform = 'translateY(' + (-p * distance) + 'px)';
      if (u < 1) {
        requestAnimationFrame(frame);
      } else {
        count += 1;
        if (count < MAX_CYCLES) setTimeout(play, CYCLE_GAP);
      }
    }
    requestAnimationFrame(frame);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !started) {
        started = true;
        play();
        io.disconnect();
      }
    });
  }, { threshold: 0.5 });
  io.observe(wrap);
})();
