const WORDS_PER_MINUTE = 200;
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const [, frontmatterBlock, body] = match;
  const meta = {};

  frontmatterBlock.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (key === "tags" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((t) => t.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    meta[key] = value;
  });

  return { meta, body: body.trim() };
}

function estimateReadMinutes(markdown) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function postHref(slug) {
  return `/musings/${encodeURIComponent(slug)}/`;
}

function formatDisplayTitle(title) {
  if (title.startsWith("Q4 ")) {
    return `<span class="post-title-quarter" aria-label="Q4"><span class="post-title-q-glyph" aria-hidden="true">O</span><span aria-hidden="true">4</span></span>${title.slice(2)}`;
  }
  return title;
}

function renderPostContent(post, bodyHtml) {
  const cover = post.cover || "/assets/editorial/architectural-hero-v1.png";
  const coverAlt = post.coverAlt || "Architectural planes in light and shadow";
  const heroMedia = post.youtube && post.videoCover
    ? `<button class="post-monument-video-cover" type="button" data-youtube-src="${post.youtube}" aria-label="Play the clip here from the beginning">
        <span class="video-cover-art"><img src="${post.videoCover}" alt="${coverAlt}"></span>
        <span class="video-cover-copy" aria-hidden="true">
          <span class="video-cover-wordmark"><img src="/assets/brand/view-finder-original-wordmark.png" alt="View Finder"></span>
          <span class="video-cover-edition">Edition ${post.edition || "001"}</span>
          <span class="video-cover-selection">
            <span class="video-cover-subtitle">${post.title}</span>
            <span class="video-cover-topic">Systems thinking in the AI era</span>
            <span class="video-cover-source">Elizabeth Stone × Lenny’s Podcast</span>
          </span>
        </span>
        <span class="video-cover-play" aria-hidden="true"><span class="video-cover-play-icon"></span>Watch the clip</span>
      </button>`
    : post.youtube
      ? `<iframe class="post-monument-youtube" src="${post.youtube}" title="Why Netflix is betting on systems thinkers, with Elizabeth Stone on Lenny’s Podcast" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
    : post.video
      ? `<video class="post-monument-video" controls playsinline preload="metadata" poster="${cover}" aria-label="${coverAlt}"><source src="${post.video}" type="video/mp4">Your browser does not support embedded video.</video>`
      : `<img src="${cover}" alt="${coverAlt}">`;
  const isEditorial = post.coverTreatment === "editorial";
  const coverTreatment = isEditorial ? " post-monument-photo--editorial" : "";
  const dropCapClass = post.dropCap ? "" : " post-body-content--no-drop-cap";
  const tagLabel = post.tags.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1)).join(" & ");
  const titleTags = isEditorial && post.tags.length
    ? `<div class="post-monument-tags">${post.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
    : "";

  return `
    <section class="post-monument-shell">
      <div class="post-monument-inner">
        <a href="/musings" class="post-monument-back">&larr; Musings</a>
        <figure class="post-monument-photo${coverTreatment}">
          ${heroMedia}
          <figcaption class="post-monument-title">
            ${isEditorial ? "" : `<p class="post-monument-eyebrow">Musings${tagLabel ? ` · ${tagLabel}` : ""}</p>`}
            <h1${post.youtube && post.videoCover ? ' class="sr-only"' : ''}>${formatDisplayTitle(post.title)}</h1>
            <p class="post-monument-meta">${formatDate(post.date)} · ${lengthLabel(post)}</p>
            ${titleTags}
          </figcaption>
        </figure>
      </div>
    </section>
    <section class="post-story-layout${isEditorial ? " post-story-layout--editorial" : ""}${post.collection === 'View Finder' ? ' post-story-layout--viewfinder' : ''}">
      ${isEditorial ? "" : `<aside class="post-story-rail" aria-label="Article information">
        <strong>OneShotLens Musings</strong>
        <span>Independent thinking.<br>Practical perspective.</span>
        <div class="post-story-tags">
          ${post.tags.map((t) => `<span>${t}</span>`).join("")}
        </div>
      </aside>`}
      <article class="post-article-copy">
        <div id="post-toc"></div>
        <div id="post-body" class="post-body-content${dropCapClass}">${bodyHtml}</div>
      </article>
    </section>
  `;

}


function lengthLabel(post) { return post.format === "film" && post.runtime ? `Film · ${post.runtime}` : `${post.readMinutes} min read`; }
module.exports = { parseFrontmatter, estimateReadMinutes, renderPostContent, formatDate, lengthLabel };
