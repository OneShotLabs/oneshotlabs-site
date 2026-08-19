// One Shot — photography timeline.
// A 2014-tumblr-dashboard-style vertical scroll feed. Always chronological;
// a small pair of arrows flips the sort direction (oldest-first / newest-first).
//
// HOW TO ADD A REAL PHOTO:
// Add an object to the PHOTOS array below. Fields:
//   src        — path to the image file (e.g. "images/photo-01.jpg"). Leave
//                null to keep the numbered placeholder block.
//   month      — full month name, e.g. "March"
//   year       — four-digit year, e.g. 2024
//   caption    — optional one-line caption shown under the date (leave "" for none)
//   ratio      — optional aspect ratio as "w / h" (e.g. "4 / 5", "1 / 1", "3 / 4").
//                Defaults to "4 / 5" if omitted. Use the real photo's own ratio
//                once you upload it so nothing gets cropped oddly.
//   visibility — "public" (default if omitted) or "private". Controls which
//                side of the Public/Private toggle a photo shows up on.
//                NOTE: this is a client-side display filter only, not real
//                access control — every photo, public or private, ships in
//                this file and loads into the page for any visitor. Don't
//                put anything here you wouldn't want a stranger to see by
//                clicking the Private tab or reading the page source.
//   location   — optional place name, printed faintly bottom-right on the
//                photo's white border (mirrors the EXIF line, which sits
//                bottom-left). Leave unset for no location line.
//
// EXIF LINE (ISO / aperture / shutter, printed faintly in the bottom-left
// of each real photo's mat):
//   This CAN be read automatically from the photo file itself at render
//   time (see hydrateExif() below, powered by the exifr library) — but
//   standard practice for every upload on this site is to pull the real
//   ISO/FNumber/ExposureTime from the file's EXIF up front (e.g. via
//   exifread) and set them explicitly below, rather than leaning on the
//   client-side auto-read. That keeps the values correct even if exifr
//   fails to load or a browser strips EXIF on save, and it's what every
//   photo currently in this file does. Fields:
//   iso        — number, e.g. 400
//   aperture   — f-number, e.g. 2 or 2.8
//   shutter    — exposure time in seconds, e.g. 0.004 for 1/250
//   filmRecipe — a label to show after the settings, e.g. "Classic Chrome"
//                or a community recipe name like "Kodak Portra 400".
//                IMPORTANT: film simulation MODE (Classic Chrome, Acros,
//                Provia, etc.) is real embedded EXIF on Fujifilm cameras
//                and the auto-reader will try to pull it in — but a named
//                "recipe" (someone's custom combination of that mode plus
//                grain/DR/WB/tone tweaks) is a nickname the community
//                assigns, not something any camera stores in the file. Set
//                filmRecipe by hand if you want that exact name to show
//                up; a manual value here always wins over anything
//                auto-detected.
// Order in this array does not matter — the timeline sorts it for you.

const PHOTOS = [
  // Shot on a FUJIFILM X100V, 23mm (35mm-equivalent) fixed lens. ISO/aperture/
  // shutter below are pinned from the files' own real EXIF (see comment
  // above) rather than left to the live auto-reader, so they render
  // instantly and correctly regardless of network/CORS conditions.
  {
    src: "images/photo-2026-08-beach-shell.jpg",
    month: "August",
    year: 2026,
    caption: "",
    ratio: "1184 / 1776",
    visibility: "private",
    iso: 640,
    aperture: 2.8,
    shutter: 0.0001111,
  },
  {
    src: "images/photo-2024-03-couch-dog.jpg",
    month: "March",
    year: 2024,
    caption: "",
    ratio: "3 / 2",
    visibility: "private",
    iso: 160,
    aperture: 3.2,
    shutter: 0.0041667,
  },
  {
    src: "images/photo-2024-08-crawl-bw.jpg",
    month: "August",
    year: 2024,
    caption: "",
    ratio: "3 / 2",
    visibility: "private",
    iso: 320,
    aperture: 2.5,
    shutter: 0.008,
    // Shot in-camera on the X100V's monochrome film simulation (confirmed
    // truly grayscale in the file itself, not just desaturated) — exact
    // recipe name wasn't in the readable EXIF, so left unset rather than
    // guessed.
  },
  {
    // v2: other swimmers airbrushed out of the water, background otherwise untouched.
    src: "images/photo-2024-08-beach-carry-v2.jpg",
    month: "August",
    year: 2024,
    caption: "",
    ratio: "3 / 2",
    visibility: "private",
    iso: 640,
    aperture: 7.1,
    shutter: 0.0005556,
  },
  {
    src: "images/photo-2024-09-baby-crawl-pink.jpg",
    month: "September",
    year: 2024,
    caption: "",
    ratio: "540 / 360",
    visibility: "private",
    iso: 640,
    aperture: 2.8,
    shutter: 0.00625,
  },
  {
    src: "images/photo-2024-11-siblings-rug.jpg",
    month: "November",
    year: 2024,
    caption: "",
    ratio: "540 / 360",
    visibility: "private",
    iso: 800,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2024-11-stroller-pink-hat.jpg",
    month: "November",
    year: 2024,
    caption: "",
    ratio: "360 / 540",
    visibility: "private",
    iso: 320,
    aperture: 3.6,
    shutter: 0.0035714,
  },
  {
    src: "images/photo-2024-12-chicago-sunset.jpg",
    month: "December",
    year: 2024,
    caption: "",
    ratio: "360 / 540",
    // No people in frame — public, matching the site's landscape/cityscape
    // shots elsewhere in this array.
    visibility: "public",
    location: "Chicago",
    iso: 1250,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2025-01-crib-bw.jpg",
    month: "January",
    year: 2025,
    caption: "",
    ratio: "540 / 360",
    visibility: "private",
    iso: 4000,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2025-03-bulldog-closeup.jpg",
    month: "March",
    year: 2025,
    caption: "",
    ratio: "1086 / 724",
    // Dog photos grouped with the family/private timeline per instruction.
    visibility: "private",
    iso: 1600,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2025-09-mountain-lake.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "540 / 360",
    // Landscape/self-portrait, no kids in frame — public per instruction.
    visibility: "public",
    location: "Glacier National Park",
    iso: 640,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2026-01-bulldog-ball.jpg",
    month: "January",
    year: 2026,
    caption: "",
    ratio: "540 / 360",
    // Dog photos grouped with the family/private timeline per instruction.
    visibility: "private",
    iso: 1250,
    aperture: 2.8,
    shutter: 0.008,
  },
  {
    src: "images/photo-2026-03-beanie-rooftop.jpg",
    month: "March",
    year: 2026,
    caption: "",
    ratio: "724 / 1086",
    visibility: "private",
    iso: 640,
    aperture: 2.8,
    shutter: 0.0035714,
  },
  {
    src: "images/photo-2026-04-beach-bucket-v2.jpg",
    month: "April",
    year: 2026,
    caption: "",
    ratio: "724 / 1086",
    visibility: "private",
    iso: 640,
    aperture: 2.8,
    shutter: 0.0003704,
  },
  {
    src: "images/photo-2025-09-mountain-pebbles.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "360 / 540",
    // Same lake/trip as photo-2025-09-mountain-lake.jpg (same day, ~2hrs
    // apart), no people in this frame — public.
    visibility: "public",
    location: "Glacier National Park",
    iso: 320,
    aperture: 3.2,
    shutter: 0.0033333,
  },
  {
    src: "images/photo-2026-01-playground-tunnel.jpg",
    month: "January",
    year: 2026,
    caption: "",
    ratio: "723 / 1086",
    visibility: "private",
    iso: 640,
    aperture: 4,
    shutter: 0.003125,
  },
  {
    src: "images/photo-2025-01-chicago-bean-bw.jpg",
    month: "January",
    year: 2025,
    caption: "",
    ratio: "1438 / 1099",
    // Landmark/crowd shot, no family — public.
    visibility: "public",
    location: "Chicago",
    iso: 320,
    aperture: 5.6,
    shutter: 0.001,
  },
  {
    src: "images/photo-2025-01-marina-city.jpg",
    month: "January",
    year: 2025,
    caption: "",
    ratio: "1067 / 1600",
    // Same Chicago walk as the Bean and river-ice shots (same day, within
    // the hour) — architecture, no people, public.
    visibility: "public",
    location: "Chicago",
    iso: 640,
    aperture: 5.6,
    shutter: 0.001,
  },
  {
    src: "images/photo-2025-01-chicago-river-ice.jpg",
    month: "January",
    year: 2025,
    caption: "",
    ratio: "1067 / 1600",
    visibility: "public",
    location: "Chicago",
    iso: 640,
    aperture: 5.6,
    shutter: 0.0009091,
  },
  {
    src: "images/photo-2025-03-siblings-closeup.jpg",
    month: "March",
    year: 2025,
    caption: "",
    ratio: "1099 / 1057",
    visibility: "private",
    iso: 640,
    aperture: 2.8,
    shutter: 0.002,
  },
  {
    src: "images/photo-2025-05-rainbow-mural-dog.jpg",
    month: "May",
    year: 2025,
    caption: "",
    ratio: "1600 / 1067",
    // Dog photos grouped with the family/private timeline per instruction.
    visibility: "private",
    iso: 640,
    aperture: 3.2,
    shutter: 0.005,
  },
  {
    src: "images/photo-2025-08-beach-dog-run.jpg",
    month: "August",
    year: 2025,
    caption: "",
    ratio: "886 / 886",
    // Dog photos grouped with the family/private timeline per instruction.
    visibility: "private",
    iso: 640,
    aperture: 3.6,
    shutter: 0.004,
  },
  {
    src: "images/photo-2024-06-boardwalk-windy.jpg",
    month: "June",
    year: 2024,
    caption: "",
    ratio: "1086 / 724",
    visibility: "private",
    iso: 640,
    aperture: 4.5,
    shutter: 0.0025,
  },
  {
    src: "images/photo-2024-08-bulldog-teeth-bw.jpg",
    month: "August",
    year: 2024,
    caption: "",
    ratio: "1086 / 724",
    // Dog photos grouped with the family/private timeline per instruction.
    visibility: "private",
    iso: 320,
    aperture: 4,
    shutter: 0.0025,
  },
  {
    src: "images/photo-2024-10-sunglasses-girl.jpg",
    month: "October",
    year: 2024,
    caption: "",
    ratio: "1600 / 1067",
    visibility: "private",
    iso: 200,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2024-10-craps-table.jpg",
    month: "October",
    year: 2024,
    caption: "",
    ratio: "1600 / 1067",
    // Casino/craps-table shot — not family, public per instruction.
    visibility: "public",
    location: "Las Vegas",
    // Pinned to always sort last in the Chronological view, regardless of
    // its real capture date (this is the earliest public photo by EXIF —
    // see sortChronological below for how the pin is applied).
    pinLast: true,
    iso: 6400,
    aperture: 2,
    shutter: 0.0125,
  },
  {
    src: "images/photo-2024-10-halloween-witch.jpg",
    month: "October",
    year: 2024,
    caption: "",
    ratio: "1067 / 1600",
    visibility: "private",
    iso: 3200,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2024-10-halloween-dino.jpg",
    month: "October",
    year: 2024,
    caption: "",
    ratio: "1067 / 1600",
    visibility: "private",
    iso: 2000,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2024-11-blanket-peek.jpg",
    month: "November",
    year: 2024,
    caption: "",
    ratio: "482 / 359",
    visibility: "private",
    iso: 640,
    aperture: 2.5,
    shutter: 0.008,
  },
  {
    src: "images/photo-2025-10-fall-park.jpg",
    month: "October",
    year: 2025,
    caption: "",
    ratio: "360 / 638",
    visibility: "public",
    location: "Chicago",
    // No EXIF survived in this file (likely stripped on export/share), so
    // no iso/aperture/shutter here — the EXIF line just won't show for it.
  },
  {
    src: "images/photo-2025-09-forest.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "724 / 1086",
    visibility: "public",
    // Same Sept 2025 trip as the mountain-lake/mountain-pebbles shots —
    // trailside forest shot from Glacier National Park.
    location: "Glacier National Park",
    iso: 3200,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2025-08-log-trail.jpg",
    month: "August",
    year: 2025,
    caption: "",
    ratio: "1086 / 724",
    visibility: "private",
    iso: 320,
    aperture: 3.2,
    shutter: 0.0041667,
  },
  {
    src: "images/photo-2024-04-rooftop-basketball-dog.jpg",
    month: "April",
    year: 2024,
    caption: "",
    ratio: "1050 / 1576",
    visibility: "private",
    iso: 640,
    aperture: 4,
    shutter: 0.003125,
  },
  {
    src: "images/photo-2024-07-watering-flowers.jpg",
    month: "July",
    year: 2024,
    caption: "",
    ratio: "1095 / 1643",
    visibility: "private",
    iso: 800,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2025-01-chicago-river-ice-underbridge.jpg",
    month: "January",
    year: 2025,
    caption: "",
    ratio: "1154 / 1732",
    visibility: "public",
    location: "Chicago",
    iso: 640,
    aperture: 2.5,
    shutter: 0.0083333,
  },
  {
    src: "images/photo-2025-05-chicago-bp-bridge.jpg",
    month: "May",
    year: 2025,
    caption: "",
    ratio: "1122 / 965",
    visibility: "public",
    location: "Chicago",
    iso: 1250,
    aperture: 11,
    shutter: 0.002,
  },
  {
    // GPS EXIF: 48.668N, 113.800W — Glacier National Park, MT.
    src: "images/photo-2025-09-glacier-mossy-forest.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "1184 / 1776",
    visibility: "public",
    location: "Glacier National Park",
    iso: 6400,
    aperture: 2,
    shutter: 0.0166667,
  },
  {
    // GPS EXIF: 48.585N, 113.903W — Glacier National Park, MT.
    src: "images/photo-2025-09-glacier-tall-trees.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "1184 / 1776",
    visibility: "public",
    location: "Glacier National Park",
    iso: 5000,
    aperture: 2,
    shutter: 0.01,
  },
  {
    // GPS EXIF: 48.585N, 113.903W — Glacier National Park, MT.
    src: "images/photo-2025-09-glacier-waterfall.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "1184 / 1776",
    visibility: "public",
    location: "Glacier National Park",
    iso: 320,
    aperture: 2.5,
    shutter: 0.0055556,
  },
  {
    // GPS EXIF: 40.713N, 73.957W — Brooklyn, NY.
    src: "images/photo-2025-09-brooklyn-bulldogs.jpg",
    month: "September",
    year: 2025,
    caption: "",
    ratio: "1184 / 1776",
    visibility: "public",
    location: "Brooklyn",
    iso: 1250,
    aperture: 2,
    shutter: 0.01,
  },
  {
    src: "images/photo-2025-11-autumn-park.jpg",
    month: "November",
    year: 2025,
    caption: "",
    ratio: "1179 / 2096",
    visibility: "public",
    location: "Chicago",
    iso: 320,
    aperture: 2.5,
    shutter: 0.008,
  },
  {
    src: "images/photo-2024-04-bulldog-paw-sock.jpg",
    month: "April", year: 2024, caption: "",
    ratio: "1776 / 1184", visibility: "private",
    iso: 320, aperture: 2, shutter: 0.01,
  },
  {
    src: "images/photo-2024-04-boat-deck-girl.jpg",
    month: "April", year: 2024, caption: "",
    ratio: "1186 / 791", visibility: "private",
    iso: 640, aperture: 2.5, shutter: 0.008,
  },
  {
    src: "images/photo-2024-07-bulldog-toy-deck.jpg",
    month: "July", year: 2024, caption: "",
    ratio: "1776 / 1184", visibility: "private",
    iso: 320, aperture: 5.6, shutter: 0.0011765,
  },
  {
    src: "images/photo-2024-12-bulldog-sleeping.jpg",
    month: "December", year: 2024, caption: "",
    ratio: "1776 / 1184", visibility: "private",
    iso: 640, aperture: 2, shutter: 0.0095238,
  },
  {
    src: "images/photo-2025-01-pink-pom-hat.jpg",
    month: "January", year: 2025, caption: "",
    ratio: "1776 / 1184", visibility: "private",
    iso: 3200, aperture: 2, shutter: 0.01,
  },
  {
    src: "images/photo-2025-06-cateye-sunglasses.jpg",
    month: "June", year: 2025, caption: "",
    ratio: "1184 / 1776", visibility: "private",
    iso: 1250, aperture: 4, shutter: 0.01,
  },
];

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function sortChronological(photos, direction) {
  // direction "asc" (default) = oldest first, feed reads top-to-bottom as
  // forward-moving time. "desc" = newest first. Photos flagged pinLast
  // (manual override, real date left untouched) always render after every
  // non-pinned photo, in their given order, regardless of direction.
  const pinned = photos.filter((p) => p.pinLast);
  const rest = photos.filter((p) => !p.pinLast);
  rest.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
  });
  if (direction === "desc") rest.reverse();
  return [...rest, ...pinned];
}

// True if a photo's own ratio is wider than it is tall — used to give
// horizontal shots a larger card without ever distorting them (the actual
// scaling stays in CSS via aspect-ratio, this just decides the ceiling).
function isLandscape(ratio) {
  const parts = String(ratio || "4 / 5").split("/").map((n) => parseFloat(n));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n)) || parts[1] === 0) return false;
  return parts[0] > parts[1];
}

function photoCardHTML(photo, index) {
  const side = index % 2 === 1 ? " side-right" : "";
  const landscape = isLandscape(photo.ratio) ? " is-landscape" : "";
  const photoEl = photo.src
    ? `<img class="timeline-photo" src="${photo.src}" alt="${photo.caption || `${photo.month} ${photo.year}`}" style="--photo-ratio: ${photo.ratio || "4 / 5"};" loading="lazy" decoding="async" />`
    : `<div class="timeline-photo is-placeholder" style="--photo-ratio: ${photo.ratio || "4 / 5"};">Photo</div>`;
  // Only real photos get an EXIF line — placeholders have no metadata to read.
  const exifEl = photo.src ? `<span class="timeline-exif"></span>` : "";
  // Location, when set, mirrors the EXIF line but right-aligned on the
  // opposite (bottom-right) corner of the photo's white border.
  const locationEl = photo.location ? `<span class="timeline-location">${photo.location}</span>` : "";

  // Dates only show on the private/family side — public timeline photos
  // (landmarks, street shots, etc.) drop the date entirely. Family dates
  // live in-frame, bottom-right of the white border (same spot/font as the
  // location line — the two never appear on the same photo).
  const isPublic = (photo.visibility || "public") === "public";
  const dateCornerEl = isPublic ? "" : `<span class="timeline-date-corner">${photo.month} ${photo.year}</span>`;
  const captionTextEl = photo.caption ? `<span class="timeline-caption-text">${photo.caption}</span>` : "";
  const captionEl = captionTextEl ? `<p class="timeline-caption">${captionTextEl}</p>` : "";

  return `
    <div class="timeline-item reveal${side}">
      <span class="timeline-item-dot" aria-hidden="true"></span>
      <div class="timeline-card${landscape}">
        <div class="timeline-photo-frame photo-framed">${photoEl}${exifEl}${locationEl}${dateCornerEl}</div>
        ${captionEl}
      </div>
    </div>`;
}

// ---- EXIF formatting + auto-read (ISO / aperture / shutter / film recipe) ----

function formatIso(iso) {
  return iso ? `ISO ${Math.round(iso)}` : "";
}

function formatAperture(fNumber) {
  if (!fNumber && fNumber !== 0) return "";
  const v = Number(fNumber);
  return `ƒ/${Number.isInteger(v) ? v : v.toFixed(1)}`; // ƒ/2, ƒ/2.8
}

function formatShutter(exposureTime) {
  if (!exposureTime && exposureTime !== 0) return "";
  const t = Number(exposureTime);
  if (t <= 0) return "";
  if (t >= 1) return `${t % 1 === 0 ? t : t.toFixed(1)}s`;
  return `1/${Math.round(1 / t)}`;
}

function buildExifLine(parts) {
  return [parts.iso, parts.aperture, parts.shutter, parts.filmRecipe]
    .filter(Boolean)
    .join("  ·  "); // "  ·  "
}


document.addEventListener("DOMContentLoaded", () => {
  const mount = document.getElementById("photo-timeline");
  if (!mount) return;

  const sortToggle = document.querySelector(".timeline-controls .timeline-sort");
  const sortButtons = sortToggle ? sortToggle.querySelectorAll(".timeline-sort-btn") : [];

  const visibilityToggle = document.querySelector(".visibility-toggle-row .visibility-toggle");
  const visibilityButtons = visibilityToggle ? visibilityToggle.querySelectorAll(".shutter-toggle-btn") : [];

  let currentDirection = "asc";
  let currentVisibility = "public";
  let io = null;

  function attachReveal() {
    if (io) io.disconnect();
    const items = mount.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add("is-visible"));
    }
  }

  function currentPhotoSet() {
    const filtered = PHOTOS.filter((p) => (p.visibility || "public") === currentVisibility);
    return sortChronological(filtered, currentDirection);
  }

  // Reads ISO/aperture/shutter/film-simulation straight from each real
  // photo's own file the instant it renders — no manual data entry
  // required. Any manually-set iso/aperture/shutter/filmRecipe fields on
  // the photo object always take priority over what's auto-detected. If
  // the exifr library hasn't loaded or a file has no readable EXIF, the
  // line falls back to whatever was set manually, or disappears entirely.
  function hydrateExif(photos) {
    const frames = mount.querySelectorAll(".timeline-photo-frame");
    photos.forEach((photo, i) => {
      if (!photo.src) return;
      const frame = frames[i];
      const expEl = frame ? frame.querySelector(".timeline-exif") : null;
      if (!expEl) return;

      const manual = {
        iso: photo.iso ? formatIso(photo.iso) : "",
        aperture: photo.aperture ? formatAperture(photo.aperture) : "",
        shutter: photo.shutter || photo.shutter === 0 ? formatShutter(photo.shutter) : "",
        filmRecipe: photo.filmRecipe || "",
      };
      const manualComplete = manual.iso && manual.aperture && manual.shutter;

      const settle = (line) => {
        if (line) expEl.textContent = line;
        else expEl.remove();
      };

      if (manualComplete || typeof exifr === "undefined") {
        settle(buildExifLine(manual));
        return;
      }

      exifr
        .parse(photo.src, { pick: ["ISO", "FNumber", "ExposureTime", "FilmMode"] })
        .then((tags) => {
          tags = tags || {};
          settle(
            buildExifLine({
              iso: manual.iso || formatIso(tags.ISO),
              aperture: manual.aperture || formatAperture(tags.FNumber),
              shutter: manual.shutter || formatShutter(tags.ExposureTime),
              filmRecipe: manual.filmRecipe || tags.FilmMode || "",
            })
          );
        })
        .catch(() => settle(buildExifLine(manual)));
    });
  }

  function render() {
    const photos = currentPhotoSet();
    mount.innerHTML = photos.length
      ? photos.map(photoCardHTML).join("")
      : `<p class="muted">No ${currentVisibility} photos yet.</p>`;
    attachReveal();
    hydrateExif(photos);
  }

  render();

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.dir === "desc" ? "desc" : "asc";
      if (next === currentDirection) return;
      currentDirection = next;

      sortButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      render();
    });
  });

  visibilityButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.visibility === "private" ? "private" : "public";
      if (next === currentVisibility) return;
      currentVisibility = next;

      visibilityButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      // Home now sits first in the markup, Away second — so the thumb's
      // "mode-b" (slide-right) state maps to Away, not Home.
      if (visibilityToggle) visibilityToggle.classList.toggle("mode-b", currentVisibility === "public");

      render();
    });
  });

  // Spine fill: tracks how far the timeline section has scrolled past,
  // written to a CSS custom property the stylesheet uses to grow the line.
  let ticking = false;
  function updateSpine() {
    const rect = mount.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const total = rect.height + vh;
    const scrolled = vh - rect.top;
    const progress = Math.min(1, Math.max(0, scrolled / total));
    mount.style.setProperty("--spine-fill", progress.toFixed(3));
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateSpine);
      ticking = true;
    }
  });
  updateSpine();
});
