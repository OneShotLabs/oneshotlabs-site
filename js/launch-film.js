// OneShotLens homepage hero — the launch film replaces the decision cube.
// Start timing intentionally mirrors the old decision-cube.js exactly: wait
// for window load, settle a paint, wait for the splash intro to fully close
// (tracked live via MutationObserver, same as the cube did), then hold one
// more second before starting — so the film begins exactly when the cube
// used to. "Watch the film" opens the full film (sound + captions) in a
// native <dialog>, which gives focus trapping and Escape-to-close for free.
(() => {
  const loop = document.getElementById("launch-film-loop");
  const replayBtn = document.getElementById("launch-film-replay");
  const watchBtn = document.getElementById("launch-film-watch");
  const dialog = document.getElementById("launch-film-dialog");
  const closeBtn = document.getElementById("launch-film-dialog-close");
  const fullVideo = document.getElementById("launch-film-full");
  if (!watchBtn || !dialog || !closeBtn || !fullVideo) return;

  // Once the film is popped out, the homepage player stops for good and shows a blank
  // cream frame, so the two copies can never play at the same time or drift out of sync.
  let poppedOut = false;
  let haltLoop = () => {};

  if (loop) {
    const splash = document.getElementById("splash");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ready = false;
    let loaded = document.readyState === "complete";
    let started = false;
    let endedOnce = false;
    let timer = null;

    const visible = () => document.visibilityState === "visible" && (!splash || getComputedStyle(splash).display === "none");
    const cancel = () => { clearTimeout(timer); timer = null; };

    function start() {
      if (poppedOut || endedOnce || !ready || !loaded || !visible()) return;
      // The video isn't muted, so this is a real attempt at sound-on
      // autoplay. Most browsers block that without a prior user gesture —
      // when they do, leave the poster showing rather than falling back to
      // a silent muted autoplay; the Play button is the fallback trigger.
      loop.play().then(() => { started = true; }).catch(() => { started = false; });
    }

    function schedule() {
      if (poppedOut || started || endedOnce || reduced || !ready || !loaded || !visible()) { cancel(); return; }
      if (timer !== null) return;
      // Start only after the uncovered document has painted, then wait one second —
      // exactly the cube's own pacing.
      timer = setTimeout(() => { timer = null; start(); }, 1000);
    }

    function afterPaint() { requestAnimationFrame(() => requestAnimationFrame(schedule)); }

    loop.addEventListener("loadedmetadata", () => { ready = true; afterPaint(); }, { once: true });
    if (loop.readyState >= HTMLMediaElement.HAVE_METADATA) { ready = true; }
    window.addEventListener("load", () => { loaded = true; afterPaint(); }, { once: true });

    // No loop attribute — plays once, then waits for the user to replay it.
    loop.addEventListener("ended", () => {
      endedOnce = true;
      cancel();
      if (replayBtn) replayBtn.classList.add("is-ready");
    });

    if (replayBtn) {
      replayBtn.addEventListener("click", () => {
        if (poppedOut) return;
        endedOnce = false;
        replayBtn.classList.remove("is-ready");
        loop.currentTime = 0;
        started = true;
        loop.play().catch(() => { endedOnce = true; replayBtn.classList.add("is-ready"); });
      });
    }

    haltLoop = () => {
      cancel();
      loop.pause();
      endedOnce = true;
      started = false;
      if (replayBtn) replayBtn.classList.remove("is-ready");
    };

    document.addEventListener("visibilitychange", () => {
      if (poppedOut) return;
      if (!visible()) {
        cancel();
        if (started) loop.pause();
      } else if (!endedOnce) {
        started = false;
        afterPaint();
      }
    });

    if (splash) new MutationObserver(afterPaint).observe(splash, { attributes: true, attributeFilter: ["style", "class"] });
    afterPaint();
  }

  function openFilm() {
    poppedOut = true;
    haltLoop();
    const stage = watchBtn.closest(".launch-film-stage");
    if (stage) stage.classList.add("is-popped-out");
    if (fullVideo.dataset.loaded !== "true") {
      fullVideo.dataset.loaded = "true";
      fullVideo.load();
    }
    dialog.showModal();
    fullVideo.currentTime = 0;
    fullVideo.play().catch(() => {});
    closeBtn.focus();
  }

  function closeFilm() {
    fullVideo.pause();
    if (dialog.open) dialog.close();
  }

  watchBtn.addEventListener("click", openFilm);
  closeBtn.addEventListener("click", closeFilm);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeFilm();
  });
  dialog.addEventListener("close", () => {
    fullVideo.pause();
    watchBtn.focus();
  });
})();
