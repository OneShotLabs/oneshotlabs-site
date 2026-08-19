// Opening splash — heritage quote reveal (fade-in lines, hard-hitting
// "hustle" drop), then vault-door logo reveal. The logo's corner
// brackets act as a camera viewfinder locked onto the mark: once they're
// visible, clicking them fires the shutter and opens the site
// immediately; left alone, the same click-and-open happens on its own a
// beat later. Plays once per browser session on first load (see the
// sessionStorage check below and the inline <script> in <head> that
// adds .no-splash before first paint) — and additionally replays itself
// if the page sits stalled, with no user input at all, for a full
// minute. That's the only trigger for a repeat play; normal browsing
// never re-shows it.
(() => {
  const splash = document.getElementById("splash");
  if (!splash) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quoteEl = document.getElementById("splash-quote");
  const stageEl = document.getElementById("splash-quote-stage");
  const frameEl = document.querySelector(".splash-frame");
  const iconFrameEl = document.querySelector(".splash-icon-frame");

  const LINE1 = "Good things come to those who wait,";
  const LINE2 = "but only things left over by those who";
  const LINE3 = "hustle.";

  const IDLE_REPLAY_MS = 60000; // stalled this long with zero input -> replay
  let playing = false;
  let idleTimer = null;

  // ---- Splash SFX: synthesized, no external audio file ----
  // Two brand moments get sound: the "hustle." slam (deep sub-thump + a
  // short filtered-noise crack) and the gold underline draw (a bright
  // three-note shimmer). Built with Web Audio instead of a sample so
  // there's nothing to fetch and it's cheap to retune. Browsers block
  // audio until a user gesture has happened on the page, so we lazily
  // create the context and try to unlock it on the first pointer/key
  // event anywhere — if no gesture has landed yet by the time a sound
  // wants to play, it fails silently and the visual animation is
  // unaffected either way.
  let audioCtx = null;
  function getAudioCtx() {
    if (reduced) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try {
        audioCtx = new Ctx();
      } catch {
        return null;
      }
    }
    return audioCtx;
  }

  ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
    window.addEventListener(
      evt,
      () => {
        const ctx = getAudioCtx();
        if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      },
      { once: true, passive: true }
    );
  });

  function playSlamSfx() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    // Sub-bass thump — the weight of the hit.
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.9, now + 0.008);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);

    // Filtered noise crack — the transient "snap" on contact.
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1100;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
  }

  function playUnderlineSfx() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    // Bright three-note shimmer, gold-coin bell character.
    const freqs = [1760, 2637, 3520];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      const startAt = now + i * 0.015;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.22 / (i + 1), startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.38);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.4);
    });

    // Quick upward sweep tracing the line draw itself.
    const sweep = ctx.createOscillator();
    sweep.type = "triangle";
    sweep.frequency.setValueAtTime(600, now);
    sweep.frequency.exponentialRampToValueAtTime(2400, now + 0.32);
    const sweepGain = ctx.createGain();
    sweepGain.gain.setValueAtTime(0.0001, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    sweep.connect(sweepGain).connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.36);
  }

  // ---- Vault-unlock SFX: bolt snap + door whoosh ----
  // Same restrained, sub-forward palette as the hustle slam — a dry
  // mechanical transient, not a stock "padlock click" earcon. The dial
  // spin itself (1.9s) stays silent; the entire cue lands on the bolt
  // snap and the door slide.
  function playBoltSnapSfx() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    // Tight metallic transient — two short, inharmonic tones with a very
    // fast decay, more "engineering" than "toy click".
    [2200, 3100].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      const startAt = now + i * 0.006;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.16 / (i + 1), startAt + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.1);
    });

    // Sub click — gives the snap body/weight without turning it into a thump.
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(180, now);
    sub.frequency.exponentialRampToValueAtTime(70, now + 0.05);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.5, now + 0.004);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    sub.connect(subGain).connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.1);

    // Faint high-frequency noise tick for the "metal edge" of the snap.
    const bufferSize = Math.floor(ctx.sampleRate * 0.02);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 4000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
  }

  function playVaultOpenSfx() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    // Low sub-rumble — the weight of a heavy door easing open, gone
    // before it can read as a cartoon "boom".
    const rumble = ctx.createOscillator();
    rumble.type = "sine";
    rumble.frequency.setValueAtTime(85, now);
    rumble.frequency.exponentialRampToValueAtTime(32, now + 0.45);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.0001, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    rumble.connect(rumbleGain).connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 0.5);

    // Filtered noise sweep — the brief pressurized "air release" as the
    // panels part, cutoff sweeping down so it reads as settling, not
    // whistling.
    const bufferSize = Math.floor(ctx.sampleRate * 0.42);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(2600, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 0.42);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.06);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
  }

  function armIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(playSplash, IDLE_REPLAY_MS);
  }

  function resetIdleTimer() {
    if (playing) return; // ignore input generated by the splash itself
    armIdleTimer();
  }

  function finish() {
    splash.style.display = "none";
    document.body.style.overflow = "";
    playing = false;
    armIdleTimer();
    // Header logo underline draw-in fires here, not on page load — the
    // header sits behind the splash overlay the whole time it plays, so
    // triggering this any earlier means it completes invisibly before
    // the doors even open. This is the moment the header first actually
    // becomes visible. Session-gated so it only plays the first time the
    // splash completes each session; a later reload where splash is
    // skipped (see the early-return above) won't call finish() at all,
    // so it correctly won't replay.
    if (!sessionStorage.getItem("oneshot-header-underline-draw-seen")) {
      sessionStorage.setItem("oneshot-header-underline-draw-seen", "1");
      document.documentElement.classList.add("header-underline-draw-play");
    }
  }

  // ---- Viewfinder shutter click ----
  // The brackets are clickable like a camera shutter button the moment
  // they're visible on screen. Clicking snaps them tight (the "click")
  // and opens the vault doors right away, skipping whatever's left of the
  // automatic hold. Left alone, the exact same click-and-open sequence
  // fires on its own once the viewfinder has held long enough.
  const DIAL_DONE = 1900; // dial-unlock finishes / brackets are ready to "shoot"
  const CLICK_DUR = 220; // matches splash-bolt-click's duration in CSS
  const DOORS_DUR = 500; // matches splash-panel-*-out's duration in CSS
  const FINISH_BUFFER = 200;

  let clickable = false;
  let doorsOpened = false;
  let shutterTimer = null;
  let openTimer = null;
  let finishTimer = null;

  function openDoors() {
    if (doorsOpened) return;
    doorsOpened = true;
    clickable = false;
    if (frameEl) frameEl.classList.remove("clickable");
    splash.classList.add("doors-open");
    playVaultOpenSfx();
    finishTimer = setTimeout(finish, DOORS_DUR + FINISH_BUFFER);
  }

  function fireShutter() {
    if (!clickable || doorsOpened) return;
    clickable = false;
    if (frameEl) frameEl.classList.remove("clickable");
    clearTimeout(shutterTimer);
    if (frameEl) frameEl.classList.add("clicked");
    if (iconFrameEl) iconFrameEl.classList.add("clicked");
    playBoltSnapSfx();
    openTimer = setTimeout(openDoors, CLICK_DUR);
  }

  if (frameEl) frameEl.addEventListener("click", fireShutter);

  function playSplash() {
    if (playing) return;
    playing = true;
    clearTimeout(idleTimer);

    // Fresh state for this run — matters for the idle-replay path, where
    // a previous play already opened the doors and clicked the shutter.
    clickable = false;
    doorsOpened = false;
    clearTimeout(shutterTimer);
    clearTimeout(openTimer);
    clearTimeout(finishTimer);
    if (frameEl) frameEl.classList.remove("clickable", "clicked");
    if (iconFrameEl) iconFrameEl.classList.remove("clicked");

    document.documentElement.classList.remove("no-splash");
    splash.style.display = "";
    splash.classList.remove("animate", "doors-open", "reduced", "quote-reduced");
    stageEl.classList.remove("quote-done");
    quoteEl.innerHTML = "";
    document.body.style.overflow = "hidden";

    const clause1 = document.createElement("span");
    clause1.className = "splash-quote-clause";
    clause1.textContent = LINE1;
    const clause2 = document.createElement("span");
    clause2.className = "splash-quote-clause";
    clause2.textContent = LINE2;
    const finale = document.createElement("span");
    finale.className = "splash-quote-finale";
    finale.textContent = LINE3;
    quoteEl.append(clause1, clause2, finale);

    if (reduced) {
      clause1.style.opacity = 1;
      clause2.style.opacity = 1;
      finale.style.opacity = 1;
      splash.classList.add("reduced", "quote-reduced");
      setTimeout(finish, 260);
      return;
    }

    const START_DELAY = 300;
    const FADE = 700;
    const PAUSE = 750;
    const PAUSE_BEFORE_HUSTLE = 998; // 750ms base, extended 33%
    const CLAUSE1_START = START_DELAY;
    const CLAUSE2_START = CLAUSE1_START + FADE + PAUSE;
    const FINALE_START = CLAUSE2_START + FADE + PAUSE_BEFORE_HUSTLE;
    const UNDERLINE_START = FINALE_START + 380;

    setTimeout(() => {
      clause1.style.animation = "splash-clause-fade 700ms ease-out forwards";
    }, CLAUSE1_START);

    setTimeout(() => {
      clause2.style.animation = "splash-clause-fade 700ms ease-out forwards";
    }, CLAUSE2_START);

    setTimeout(() => {
      finale.style.animation = "punch-drop 220ms cubic-bezier(0.55,0,1,0.45) forwards";
    }, FINALE_START);

    // Impact flash + slam thump land together, right at the moment the
    // punch-drop keyframes hit their squash (70% of 220ms ≈ 150ms in).
    setTimeout(() => {
      finale.classList.add("impact-flash");
      playSlamSfx();
    }, FINALE_START + 150);

    setTimeout(() => {
      finale.classList.add("underline-go");
      playUnderlineSfx();
    }, UNDERLINE_START);

    const QUOTE_DONE = UNDERLINE_START + 163 + 1250; // pause 1.25s after underline before quote fades
    const QUOTE_FADE = 616; // quote fades out
    setTimeout(() => {
      stageEl.classList.add("quote-done");
    }, QUOTE_DONE);

    setTimeout(() => {
      splash.classList.add("animate");
      clickable = true;
      if (frameEl) frameEl.classList.add("clickable");
      // Auto path: same shutter click and door-open the visitor would
      // trigger by clicking, just fired on a timer once the dial-unlock
      // settles (1900ms) if nobody has clicked already.
      shutterTimer = setTimeout(fireShutter, DIAL_DONE);
    }, QUOTE_DONE + QUOTE_FADE); // logo pops on screen right as the quote finishes fading
  }

  ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"].forEach((evt) => {
    window.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  if (sessionStorage.getItem("oneshot-splash-seen")) {
    splash.style.display = "none";
    armIdleTimer();
    return;
  }
  sessionStorage.setItem("oneshot-splash-seen", "1");
  playSplash();
})();
