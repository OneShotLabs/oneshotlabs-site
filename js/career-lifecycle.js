// Career page — deal lifecycle animation.
// Horizontal four-sided rotating display: Underwriting → Closing →
// Construction → Asset Management & Servicing, on a loop. Ported from a
// standalone export; speed/pitch controls from that export were dropped
// (dev-only preview tools) and fixed at sensible defaults below.
//
// Caption sync: everything below — rotation, caption hide, text swap, and
// caption reveal — is driven off one rAF clock (the tick() loop). Nothing
// runs on an independent setTimeout, so the caption can never drift out of
// step with the icon, no matter how long the page has been running.
(() => {
  const rotor = document.getElementById("dl-rotor");
  if (!rotor) return;

  const readout = document.getElementById("dl-readout");
  const stageTitle = document.getElementById("dl-stage-title");
  const stageText = document.getElementById("dl-stage-text");

  const stages = [
    ["UNDERWRITING", "Financial review, risk analysis, and deal structuring."],
    ["CLOSING", "Documentation, execution, and transaction completion."],
    ["CONSTRUCTION", "Capital deployment and project execution."],
    ["ASSET MANAGEMENT & SERVICING", "Long-term ownership, servicing, and optimization."],
  ];

  let index = 0;
  let angle = 0;
  const turnDuration = 880; // ms per quarter-turn (12% faster than 1000ms)
  const holdDuration = 2200; // ms paused on each face, caption fully visible

  // Must match .dl-readout's own transition durations in style.css exactly
  // (opacity 0.22s, transform 0.3s) — these are read here only as the
  // timing budget for scheduling the swap, not to drive the animation
  // itself, which stays pure CSS.
  const CAPTION_FADE_OUT = 220;
  const CAPTION_FADE_IN = 300;

  let phase = "hold";
  let phaseStart = performance.now();
  let fromAngle = 0;
  let toAngle = 0;
  let hideDone = false;
  let textSwapped = false;
  let showStarted = false;
  let frameId;

  const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  function applyStage(i) {
    stageTitle.textContent = stages[i][0];
    stageText.textContent = stages[i][1];
  }

  function tick(now) {
    const elapsed = now - phaseStart;

    if (phase === "hold") {
      rotor.style.transform = `rotateY(${angle}deg)`;
      if (elapsed >= holdDuration) {
        fromAngle = angle;
        toAngle = angle - 90;
        phase = "turn";
        phaseStart = now;
        hideDone = false;
        textSwapped = false;
        showStarted = false;
      }
    } else {
      const p = Math.min(1, elapsed / turnDuration);
      const eased = ease(p);
      const current = fromAngle + (toAngle - fromAngle) * eased;
      rotor.style.transform = `rotateY(${current}deg)`;

      // 1. The instant the carousel starts spinning, the caption drops out
      //    — no lingering old text while the icon is mid-turn.
      if (!hideDone) {
        hideDone = true;
        readout.classList.add("dl-changing");
      }

      // 2. Swap the text once it's fully invisible (after its own fade-out
      //    finishes), so the change itself is never seen.
      if (!textSwapped && elapsed >= CAPTION_FADE_OUT) {
        textSwapped = true;
        applyStage((index + 1) % 4);
      }

      // 3. Start the caption's fade back in timed so it finishes exactly
      //    when the icon lands (turnDuration) — not before, not after.
      if (!showStarted && elapsed >= turnDuration - CAPTION_FADE_IN) {
        showStarted = true;
        readout.classList.remove("dl-changing");
      }

      if (p >= 1) {
        angle = toAngle;
        index = (index + 1) % 4;
        phase = "hold";
        phaseStart = now;
      }
    }

    frameId = requestAnimationFrame(tick);
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    // No spin — just cycle the caption text so the info still comes through.
    rotor.style.transform = "rotateY(0deg)";
    let i = 0;
    setInterval(() => {
      readout.classList.add("dl-changing");
      setTimeout(() => {
        i = (i + 1) % 4;
        applyStage(i);
        readout.classList.remove("dl-changing");
      }, CAPTION_FADE_OUT);
    }, 2500);
    return;
  }

  rotor.style.transform = "rotateY(0deg)";
  frameId = requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => cancelAnimationFrame(frameId));
})();
