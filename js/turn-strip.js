(function () {
  var root = document.querySelector('.turn-strip');
  if (!root) return;

  // Master timeline: every stage duration below is the single source of truth.
  // Stage 0 = logo nudge (sequence trigger); everything else derives its
  // start/end from cumulative offsets into this one timeline. Every
  // inter-action step runs at a uniform 0.45s (20% longer than the prior
  // 0.375s step — the full nudge-then-dials sweep is 20% longer end to end).
  // Each dial has a single 'roll' stage only — no pre-roll dip below the
  // x-axis (9:00/270deg = the 45-min mark is the hand's resting position
  // and its floor; it only ever sweeps clockwise up and over to 3:00/90deg,
  // the 15-min mark, before settling).
  var STEP_DUR = 450; // matches .turn-logo.nudging / .turn-hand.rolling CSS duration
  var LOGO_NUDGE_DUR = STEP_DUR;
  var DIAL_ROLL_DUR = STEP_DUR;
  var GAP_DUR = STEP_DUR;
  var PRE_CHECK_GAP_DUR = STEP_DUR;
  var CHECK_DUR = 1875;

  var STAGES = [
    { type: 'logoNudge', dur: LOGO_NUDGE_DUR },
    { type: 'roll', dial: 0, dur: DIAL_ROLL_DUR },
    { type: 'gap', dur: GAP_DUR },
    { type: 'roll', dial: 1, dur: DIAL_ROLL_DUR },
    { type: 'gap', dur: GAP_DUR },
    { type: 'roll', dial: 2, dur: DIAL_ROLL_DUR },
    { type: 'gap', dur: GAP_DUR },
    { type: 'roll', dial: 3, dur: DIAL_ROLL_DUR },
    { type: 'gap', dur: PRE_CHECK_GAP_DUR },
    { type: 'check', dur: CHECK_DUR }
  ];
  var CAPTIONS = ['Weeks turn into days', 'Days turn into hours', 'Hours turn into minutes'];
  var FINAL_CAPTION = 'One shot, done right.';
  var CHECK_TEXT_DELAY = 300; // let the checkmark finish its own fade-in first

  // Precompute cumulative start times so every visual reads off the same clock.
  var starts = [0];
  for (var i = 0; i < STAGES.length; i++) starts.push(starts[i] + STAGES[i].dur);
  var TOTAL_DUR = starts[STAGES.length];

  var eyebrow = document.getElementById('turn-eyebrow');
  var logo = document.getElementById('turn-logo');
  var check = document.getElementById('turn-check');
  var trackFill = document.getElementById('turn-track-fill');
  var track = trackFill.parentElement;
  var faces = Array.prototype.slice.call(root.querySelectorAll('.turn-dial-face'));
  var dials = Array.prototype.slice.call(root.querySelectorAll('.turn-dial .turn-hand'));
  var logoRing = root.querySelector('.turn-logo-ring');
  var rings = Array.prototype.slice.call(root.querySelectorAll('.turn-dial-ring'));
  var ticks = Array.prototype.slice.call(root.querySelectorAll('.turn-dial-tick'));
  var RING_RETRACT_DELAY = 200; // ms the ring holds after its element settles, before fading
  var TICK_FLASH_DUR = 220; // ms the landing tick stays lit
  var MAX_CYCLES = 1;

  // The fill line's leading edge should physically touch each dial's left
  // edge at the exact moment that dial starts rolling — measured from the
  // real DOM geometry (not guessed percentages) so it stays correct if
  // sizes ever change again. Between those checkpoints we interpolate
  // linearly, so the sweep still reads as one cohesive motion rather than
  // a series of visible speed changes (the dials are evenly spaced, so the
  // segments end up nearly identical anyway).
  function buildFillCheckpoints() {
    var trackRect = track.getBoundingClientRect();
    var targets = faces.map(function (face) {
      var faceRect = face.getBoundingClientRect();
      var frac = (faceRect.left - trackRect.left) / trackRect.width;
      return Math.min(1, Math.max(0, frac));
    });
    return [
      { t: 0, p: 0 },
      { t: starts[1], p: targets[0] },
      { t: starts[3], p: targets[1] },
      { t: starts[5], p: targets[2] },
      { t: starts[7], p: targets[3] },
      { t: starts[9], p: 1 }
    ];
  }

  function fillAt(checkpoints, t) {
    for (var i = 0; i < checkpoints.length - 1; i++) {
      var a = checkpoints[i], b = checkpoints[i + 1];
      if (t <= b.t) {
        var span = b.t - a.t;
        var localP = span > 0 ? (t - a.t) / span : 1;
        return a.p + (b.p - a.p) * Math.min(1, Math.max(0, localP));
      }
    }
    return checkpoints[checkpoints.length - 1].p;
  }

  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  function stageIndexAt(t) {
    for (var s = STAGES.length - 1; s >= 0; s--) if (t >= starts[s]) return s;
    return 0;
  }

  function captionFor(stageIdx, t) {
    var stage = STAGES[stageIdx];
    if (stage.type === 'check' && t - starts[stageIdx] >= CHECK_TEXT_DELAY) {
      return FINAL_CAPTION;
    }
    return CAPTIONS[stageIdx <= 2 ? 0 : stageIdx <= 4 ? 1 : 2];
  }

  // Single driving timeline: one rAF loop computes elapsed t, derives every
  // visual (throughline fill, dial rotation, logo nudge, checkmark) from t —
  // no independent per-element timers, so nothing can drift out of sync.
  function playCycle(onDone) {
    var t0 = null;
    var checkpoints = buildFillCheckpoints();
    logo.classList.remove('nudging');
    void logo.offsetWidth;
    logo.classList.add('nudging');

    function frame(now) {
      if (t0 === null) t0 = now;
      var t = now - t0;
      if (t > TOTAL_DUR) t = TOTAL_DUR;

      var stageIdx = stageIndexAt(t);
      eyebrow.textContent = captionFor(stageIdx, t);

      trackFill.style.width = (fillAt(checkpoints, t) * 100) + '%';

      // Construction ring around the star: on for the logo-nudge stage,
      // retracts shortly after — read off the same t as everything else.
      if (logoRing) logoRing.classList.toggle('active', t < starts[1] + RING_RETRACT_DELAY);

      dials.forEach(function (hand, i) {
        var rollIdx = 1 + i * 2;
        var rollStart = starts[rollIdx], rollEnd = starts[rollIdx + 1];
        var angle;
        if (t < rollStart) {
          angle = 270; // resting at 9:00 / the 45-min mark, on the x-axis
        } else if (t < rollEnd) {
          var rp = Math.min(1, (t - rollStart) / (rollEnd - rollStart));
          angle = 270 + 180 * ease(rp); // sweep clockwise up and over to 3:00 — never below the x-axis
        } else {
          angle = 450;
        }
        hand.style.transition = 'none';
        hand.style.transform = 'translate(-50%,-100%) rotate(' + angle + 'deg)';

        // Construction ring: on while this dial is actively rolling (plus a
        // short hold), retracts once settled. Rim tick flashes right on
        // landing at the 15-min mark to mark the precise stop.
        if (rings[i]) rings[i].classList.toggle('active', t >= rollStart && t < rollEnd + RING_RETRACT_DELAY);
        if (ticks[i]) ticks[i].classList.toggle('flash', t >= rollEnd && t < rollEnd + TICK_FLASH_DUR);
      });

      check.classList.toggle('visible', STAGES[stageIdx].type === 'check');

      if (t < TOTAL_DUR) {
        requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  function runCycles(n) {
    if (n >= MAX_CYCLES) return;
    playCycle(function () { runCycles(n + 1); });
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    runCycles(0);
  }

  // Trigger: once the strip has been continuously 100%-in-viewport for
  // this long, fire the nudge (star roll-forward) to kick off the
  // sequence. Spec: must begin within 0.5s of the strip being fully
  // visible — no long "settle" buffer. If the page/strip becomes visible
  // later than 0.5s after load, the nudge still fires immediately upon
  // full visibility rather than being skipped or delayed further.
  var VISIBLE_HOLD = 500;
  function isFullyVisible() {
    var r = root.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    return r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw && r.height > 0;
  }

  var visibleSince = null;
  function splashBlocking() {
    var splash = document.getElementById('splash');
    return splash && getComputedStyle(splash).display !== 'none';
  }
  function poll() {
    if (started) return;
    if (isFullyVisible() && !splashBlocking()) {
      if (visibleSince === null) visibleSince = performance.now();
      if (performance.now() - visibleSince >= VISIBLE_HOLD) {
        start();
        return;
      }
    } else {
      visibleSince = null;
    }
    requestAnimationFrame(poll);
  }

  if (document.readyState === 'complete') {
    poll();
  } else {
    window.addEventListener('load', poll);
  }
  window.addEventListener('scroll', poll, { passive: true });
  window.addEventListener('resize', poll);
})();
