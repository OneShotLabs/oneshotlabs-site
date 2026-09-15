// Career page film — start promptly, hold the final mark, replay on request.
(() => {
  const film = document.getElementById("career-film");
  const replay = document.getElementById("career-film-replay");
  const audioButton = document.getElementById("career-film-audio");
  if (!film || !replay || !audioButton) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let finalHoldTime = 24.80;
  let locked = false;
  let monitoring = false;
  let narrationEnabled = false;

  const setNarrationState = (enabled) => {
    narrationEnabled = enabled;
    film.muted = !enabled;
    audioButton.setAttribute("aria-pressed", String(enabled));
    audioButton.setAttribute("aria-label", enabled ? "Turn narration off" : "Play narration and restart animation");
    audioButton.querySelector("span").textContent = enabled ? "Narration on" : "Play narration";
  };

  const holdFinalMark = () => {
    if (locked) return;
    locked = true;
    film.pause();
    film.currentTime = Math.min(finalHoldTime, Math.max(0, film.duration - 0.08));
    replay.classList.add("is-ready");
  };

  const monitor = () => {
    if (!locked && film.currentTime >= finalHoldTime) holdFinalMark();
    if (!locked && "requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      film.requestVideoFrameCallback(monitor);
    } else {
      monitoring = false;
    }
  };

  const playPromptly = () => {
    if (film.readyState < HTMLMediaElement.HAVE_METADATA) return;
    if (reduceMotion.matches) {
      holdFinalMark();
      return;
    }
    film.play().then(() => {
      if (!monitoring && "requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        monitoring = true;
        film.requestVideoFrameCallback(monitor);
      }
    }).catch(() => {
      replay.classList.add("is-ready");
    });
  };

  film.addEventListener("loadedmetadata", () => {
    finalHoldTime = Math.max(0, film.duration - 0.15);
    playPromptly();
  }, { once: true });

  film.addEventListener("ended", holdFinalMark);

  replay.addEventListener("click", () => {
    locked = false;
    replay.classList.remove("is-ready");
    film.currentTime = 0;
    film.play().then(() => {
      if (!monitoring && "requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        monitoring = true;
        film.requestVideoFrameCallback(monitor);
      }
    }).catch(() => replay.classList.add("is-ready"));
  });

  audioButton.addEventListener("click", () => {
    if (narrationEnabled) {
      setNarrationState(false);
      return;
    }

    setNarrationState(true);
    locked = false;
    replay.classList.remove("is-ready");
    film.currentTime = 0;
    film.play().catch(() => {
      setNarrationState(false);
      replay.classList.add("is-ready");
    });
  });

  // Muted inline video is eligible for autoplay. This early attempt and the
  // metadata retry keep startup comfortably inside the requested two seconds.
  window.setTimeout(playPromptly, 180);
})();
