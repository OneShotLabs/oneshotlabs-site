// Career page film — play the complete master, then hold its true final frame.
(() => {
  const film = document.getElementById("career-film");
  const replay = document.getElementById("career-film-replay");
  const audioButton = document.getElementById("career-film-audio");
  if (!film || !replay || !audioButton) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let locked = false;
  let narrationEnabled = false;

  const setNarrationState = (enabled) => {
    narrationEnabled = enabled;
    film.muted = !enabled;
    audioButton.setAttribute("aria-pressed", String(enabled));
    audioButton.setAttribute("aria-label", enabled ? "Turn narration off" : "Play narration and restart animation");
    audioButton.querySelector("span").textContent = enabled ? "Narration on" : "Play narration";
  };

  const seekToFinalFrame = () => {
    if (!Number.isFinite(film.duration) || film.duration <= 0) return false;
    film.currentTime = Math.max(0, film.duration - 0.08);
    return true;
  };

  const holdFinalMark = () => {
    if (locked || !seekToFinalFrame()) return;
    locked = true;
    film.pause();
    replay.classList.add("is-ready");
  };

  const playPromptly = () => {
    if (film.readyState < HTMLMediaElement.HAVE_METADATA) return;
    if (reduceMotion.matches) {
      holdFinalMark();
      return;
    }
    film.play().catch(() => replay.classList.add("is-ready"));
  };

  film.addEventListener("loadedmetadata", playPromptly);
  film.addEventListener("ended", holdFinalMark);

  replay.addEventListener("click", () => {
    locked = false;
    replay.classList.remove("is-ready");
    film.currentTime = 0;
    film.play().catch(() => replay.classList.add("is-ready"));
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

  // Handle both metadata orderings: the video may be ready before this deferred
  // controller executes, or it may become ready afterward.
  if (film.readyState >= HTMLMediaElement.HAVE_METADATA) playPromptly();
  window.setTimeout(playPromptly, 180);
})();
