// Photography timeline lightbox — click any real photo to view it enlarged,
// with its date/caption underneath. Event-delegated on the timeline mount
// (rather than binding to individual frames) so it keeps working after the
// chronological/shuffle and public/private toggles re-render the DOM out
// from under any static listeners. Placeholder cards (no real <img>) are
// not clickable.
//
// The enlarged photo keeps the exact same white-mat .photo-framed border
// as the timeline card it was opened from, plus whichever detail line
// that card carries — the EXIF line (bottom-left, every real photo) and
// either the location (Away side) or the date (Home side), never both.
// Rather than re-deriving any of that, this just clones the already-
// rendered spans straight off the source frame, so it's guaranteed to
// match the main timeline exactly, category for category.
(() => {
  const mount = document.getElementById("photo-timeline");
  if (!mount) return;

  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous">&larr;</button>
    <div class="lightbox-stage"></div>
    <button type="button" class="lightbox-nav lightbox-next" aria-label="Next">&rarr;</button>
  `;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector(".lightbox-stage");
  let current = -1;

  function frames() {
    return Array.from(mount.querySelectorAll(".timeline-photo-frame")).filter((f) =>
      f.querySelector("img.timeline-photo")
    );
  }

  function render(i) {
    const list = frames();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    const frame = list[current];
    const img = frame.querySelector("img.timeline-photo");

    // Clone the frame's own detail spans (EXIF bottom-left, and whichever
    // of location/date sits bottom-right) exactly as the timeline card
    // rendered them — already hydrated with real EXIF text by this point,
    // since the card was on screen and clicked before the popup opened.
    const exifEl = frame.querySelector(".timeline-exif");
    const locationEl = frame.querySelector(".timeline-location");
    const dateCornerEl = frame.querySelector(".timeline-date-corner");
    const detailsHTML = [exifEl, locationEl, dateCornerEl]
      .filter(Boolean)
      .map((el) => el.outerHTML)
      .join("");

    stage.innerHTML = `
      <div class="timeline-photo-frame photo-framed lightbox-framed">
        <img src="${img.getAttribute("src")}" alt="${img.getAttribute("alt") || ""}" />
        ${detailsHTML}
      </div>`;

    const captionEl = frame.parentElement && frame.parentElement.querySelector(".timeline-caption");
    const captionText = captionEl ? captionEl.textContent.replace(/\s+/g, " ").trim() : "";

    const existingCaption = overlay.querySelector(".lightbox-caption");
    if (existingCaption) existingCaption.remove();
    if (captionText) {
      const p = document.createElement("p");
      p.className = "lightbox-caption";
      p.textContent = captionText;
      overlay.appendChild(p);
    }
  }

  function open(i) {
    render(i);
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  mount.addEventListener("click", (e) => {
    const frame = e.target.closest(".timeline-photo-frame");
    if (!frame || !frame.querySelector("img.timeline-photo")) return;
    const i = frames().indexOf(frame);
    if (i > -1) open(i);
  });

  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.querySelector(".lightbox-prev").addEventListener("click", () => render(current - 1));
  overlay.querySelector(".lightbox-next").addEventListener("click", () => render(current + 1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") render(current - 1);
    if (e.key === "ArrowRight") render(current + 1);
  });
})();
