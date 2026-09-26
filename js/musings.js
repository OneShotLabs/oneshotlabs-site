// OneShotLens — musings engine.
//
// Content model: /posts/manifest.json lists post filenames (no extension).
// Each /posts/<slug>.md is a plain markdown file with a frontmatter block:
//
//   ---
//   title: Some Title
//   date: 2026-01-01
//   tags: [tag-one, tag-two]
//   excerpt: One line for the card and the <meta description>.
//   ---
//   Markdown body starts here.
//
// Adding a post = drop a new .md file in /posts and add its filename to
// manifest.json. Everything else — the index card, tags, search, sort,
// pagination, reading time, and (on the post page) the TOC and prev/next —
// is generated from that automatically.
//
// IMPORTANT: this fetches local files, which browsers block under the
// file:// protocol (CORS). Serve this folder over http(s) to see it work —
// e.g. `python3 -m http.server` from this directory, or any static host.

const POSTS_DIR = "/posts/";
const MANIFEST_URL = POSTS_DIR + "manifest.json";
const WORDS_PER_MINUTE = 200;

// ---------- Frontmatter + markdown loading ----------

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
  return `/musings/${encodeURIComponent(slug)}`;
}

async function loadAllPosts() {
  const manifestRes = await fetch(MANIFEST_URL);
  if (!manifestRes.ok) throw new Error("Could not load posts/manifest.json");
  const manifest = await manifestRes.json();
  const slugs = manifest.posts || [];

  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const res = await fetch(`${POSTS_DIR}${slug}.md`);
      if (!res.ok) throw new Error(`Could not load posts/${slug}.md`);
      const raw = await res.text();
      const { meta, body } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title || slug,
        date: meta.date || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        excerpt: meta.excerpt || "",
        cover: meta.cover || "",
        coverAlt: meta.coverAlt || "",
        coverTreatment: meta.coverTreatment || "",
        dropCap: meta.dropCap !== "false",
        socialImage: meta.socialImage || "",
        socialAlt: meta.socialAlt || "",
        socialDescription: meta.socialDescription || "",
        body,
        readMinutes: estimateReadMinutes(body),
      };
    })
  );

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first
  return posts;
}

function showFetchError(container, err) {
  container.innerHTML = `
    <div class="musings-status">
      <p><strong>Couldn't load posts.</strong></p>
      <p>${err.message || err}</p>
      <p>This is almost always because the page was opened directly as a file
      (<code>file://</code>) rather than served over http(s). Browsers block
      that kind of fetch for security reasons. Try running a quick local
      server from this folder — <code>python3 -m http.server</code> — then
      open <code>http://localhost:8000</code>, or deploy it to any static host.</p>
    </div>`;
}

function setMeta(attribute, name, content) {
  if (!content) return;
  let meta = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

// ---------- Musings index page ----------

async function initMusingsIndex() {
  const grid = document.getElementById("musings-grid");
  const tagBar = document.getElementById("musings-tags");
  const searchInput = document.getElementById("musings-search");
  const sortSelect = document.getElementById("musings-sort");
  const paginationEl = document.getElementById("musings-pagination");
  const countEl = document.getElementById("musings-count");
  if (!grid) return;

  const PAGE_SIZE = 6;
  let allPosts = [];
  let activeTag = "all";
  let query = "";
  let sortOrder = "newest";
  let page = 1;

  try {
    allPosts = await loadAllPosts();
  } catch (err) {
    showFetchError(grid, err);
    return;
  }

  // Build tag filter bar
  const allTags = Array.from(new Set(allPosts.flatMap((p) => p.tags))).sort();
  tagBar.innerHTML = "";
  const makeTagBtn = (label, value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-btn";
    btn.textContent = label;
    btn.dataset.tag = value;
    if (value === activeTag) btn.classList.add("is-active");
    btn.addEventListener("click", () => {
      activeTag = value;
      page = 1;
      tagBar.querySelectorAll(".tag-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tag === value));
      render();
    });
    return btn;
  };
  tagBar.appendChild(makeTagBtn("All", "all"));
  allTags.forEach((tag) => tagBar.appendChild(makeTagBtn(tag, tag)));

  searchInput?.addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase();
    page = 1;
    render();
  });

  sortSelect?.addEventListener("change", (e) => {
    sortOrder = e.target.value;
    page = 1;
    render();
  });

  function getFiltered() {
    let posts = allPosts.filter((p) => activeTag === "all" || p.tags.includes(activeTag));
    if (query) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.excerpt.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    posts = [...posts].sort((a, b) => {
      if (sortOrder === "oldest") return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; // newest
    });
    return posts;
  }

  function render() {
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    if (countEl) {
      countEl.textContent = `${filtered.length} post${filtered.length === 1 ? "" : "s"}`;
    }

    if (!pageItems.length) {
      grid.innerHTML = `<div class="musings-status"><p>No posts match that search or filter.</p></div>`;
    } else {
      grid.innerHTML = pageItems
        .map(
          (p) => `
        <a class="post-card" href="${postHref(p.slug)}">
          <div class="post-card-meta">
            <span>${formatDate(p.date)}</span>
            <span>${p.readMinutes} min read</span>
          </div>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <div class="post-card-tags">
            ${p.tags.map((t) => `<span class="tag-pill">${t}</span>`).join("")}
          </div>
        </a>`
        )
        .join("");
    }

    // Pagination controls
    if (paginationEl) {
      if (totalPages <= 1) {
        paginationEl.innerHTML = "";
      } else {
        paginationEl.innerHTML = `
          <button type="button" class="btn" data-dir="prev" ${page === 1 ? "disabled" : ""}>Previous</button>
          <span class="pagination-status">Page ${page} of ${totalPages}</span>
          <button type="button" class="btn" data-dir="next" ${page === totalPages ? "disabled" : ""}>Next</button>
        `;
        paginationEl.querySelector('[data-dir="prev"]')?.addEventListener("click", () => {
          page = Math.max(1, page - 1);
          render();
          grid.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        paginationEl.querySelector('[data-dir="next"]')?.addEventListener("click", () => {
          page = Math.min(totalPages, page + 1);
          render();
          grid.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
  }

  render();
}

// ---------- Single post page ----------

async function initPostPage() {
  const contentEl = document.getElementById("post-content");
  if (!contentEl) return;

  const params = new URLSearchParams(window.location.search);
  const cleanRoute = window.location.pathname.match(/^\/musings\/([^/]+)\/?$/);
  const slug = params.get("slug") || (cleanRoute ? decodeURIComponent(cleanRoute[1]) : null);

  let allPosts = [];
  try {
    allPosts = await loadAllPosts();
  } catch (err) {
    showFetchError(contentEl, err);
    return;
  }

  const index = allPosts.findIndex((p) => p.slug === slug);
  const post = index >= 0 ? allPosts[index] : null;

  if (!post) {
    contentEl.innerHTML = `
      <div class="musings-status">
        <p><strong>Post not found.</strong></p>
        <p>No post matches "${slug || ""}". <a href="/musings" class="post-title-link">Back to Musings</a>.</p>
      </div>`;
    return;
  }

  document.title = `${post.title} — Musings`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = post.excerpt;
  const canonical = document.querySelector('link[rel="canonical"]');
  const canonicalUrl = new URL(postHref(post.slug), window.location.origin).href;
  if (canonical) canonical.href = canonicalUrl;

  const socialImage = new URL(post.socialImage || post.cover || "/assets/editorial/architectural-hero-v1.png", window.location.origin).href;
  const socialDescription = post.socialDescription || post.excerpt;
  const socialAlt = post.socialAlt || post.coverAlt || post.title;
  setMeta("property", "og:site_name", "OneShotLens");
  setMeta("property", "og:type", "article");
  setMeta("property", "og:title", post.title);
  setMeta("property", "og:description", socialDescription);
  setMeta("property", "og:url", canonicalUrl);
  setMeta("property", "og:image", socialImage);
  setMeta("property", "og:image:alt", socialAlt);
  setMeta("property", "article:published_time", post.date);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", post.title);
  setMeta("name", "twitter:description", socialDescription);
  setMeta("name", "twitter:image", socialImage);
  setMeta("name", "twitter:image:alt", socialAlt);

  const bodyHtml =
    typeof marked !== "undefined" ? marked.parse(post.body) : `<pre>${post.body}</pre>`;

  const cover = post.cover || "/assets/editorial/architectural-hero-v1.png";
  const coverAlt = post.coverAlt || "Architectural planes in light and shadow";
  const isEditorial = post.coverTreatment === "editorial";
  const coverTreatment = isEditorial ? " post-monument-photo--editorial" : "";
  const dropCapClass = post.dropCap ? "" : " post-body-content--no-drop-cap";
  const tagLabel = post.tags.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1)).join(" & ");
  const titleTags = isEditorial && post.tags.length
    ? `<div class="post-monument-tags">${post.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
    : "";

  document.querySelector(".post-page")?.classList.toggle("post-page--editorial", isEditorial);

  contentEl.innerHTML = `
    <section class="post-monument-shell">
      <div class="post-monument-inner">
        <a href="/musings" class="post-monument-back">&larr; Musings</a>
        <figure class="post-monument-photo${coverTreatment}">
          <img src="${cover}" alt="${coverAlt}">
          <figcaption class="post-monument-title">
            ${isEditorial ? "" : `<p class="post-monument-eyebrow">Musings${tagLabel ? ` · ${tagLabel}` : ""}</p>`}
            <h1>${post.title}</h1>
            <p class="post-monument-meta">${formatDate(post.date)} · ${post.readMinutes} min read</p>
            ${titleTags}
          </figcaption>
        </figure>
      </div>
    </section>
    <section class="post-story-layout${isEditorial ? " post-story-layout--editorial" : ""}">
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

  // Build a TOC from h2 headings if the post has enough of them to be worth it.
  const bodyContainer = document.getElementById("post-body");
  const headings = bodyContainer.querySelectorAll("h2");
  if (headings.length >= 2) {
    const tocItems = [];
    headings.forEach((h) => {
      const id = slugifyHeading(h.textContent);
      h.id = id;
      tocItems.push(`<li><a href="#${id}">${h.textContent}</a></li>`);
    });
    document.getElementById("post-toc").innerHTML = `
      <nav class="post-toc" aria-label="Table of contents">
        <p class="post-toc-label">Contents</p>
        <ul>${tocItems.join("")}</ul>
      </nav>`;
  }

  // Prev/next based on reading order (newest-first list).
  const prev = index > 0 ? allPosts[index - 1] : null;
  const next = index < allPosts.length - 1 ? allPosts[index + 1] : null;
  const navEl = document.getElementById("post-nav");
  if (navEl) {
    const navEntry = (target, direction, destinationNumber) => {
      if (!target) return "";
      const targetTags = target.tags
        .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
        .join(" & ");
      const label = direction === "prev" ? "Earlier musing" : "Continue reading";
      const arrow = direction === "prev" ? "&larr;" : "&rarr;";
      return `
        <a class="post-nav-link post-nav-link--${direction}" href="${postHref(target.slug)}">
          <span class="post-nav-number">${String(destinationNumber).padStart(2, "0")}</span>
          <span class="post-nav-copy">
            <span class="post-nav-label">${label}${targetTags ? ` · ${targetTags}` : ""}</span>
            <span class="post-nav-title">${target.title}</span>
            <span class="post-nav-meta">${formatDate(target.date)} · ${target.readMinutes} min read</span>
          </span>
          <span class="post-nav-arrow" aria-hidden="true">${arrow}</span>
        </a>`;
    };

    navEl.innerHTML = `
      <div class="post-nav-ledger">
        ${navEntry(prev, "prev", index)}
        ${navEntry(next, "next", index + 2)}
      </div>
      <div class="post-nav-footer">
        <a class="post-nav-index" href="/musings">Musings index</a>
        <span>OneShotLens · ${new Date(post.date + "T00:00:00").getFullYear()}</span>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initMusingsIndex();
  initPostPage();
});
