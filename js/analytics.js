(() => {
  "use strict";

  const endpoint = "/api/events";
  const campaignKey = "osl-campaign";
  const allowedCampaignFields = ["source", "medium", "campaign", "content"];

  const clean = (value, max = 100) => String(value || "").replace(/[^\w .:/?&=%+@-]/g, "").slice(0, max);

  const readCampaign = () => {
    const params = new URLSearchParams(location.search);
    const current = {};
    allowedCampaignFields.forEach((field) => {
      const value = params.get(`utm_${field}`);
      if (value) current[field] = clean(value, 80);
    });
    try {
      if (Object.keys(current).length) sessionStorage.setItem(campaignKey, JSON.stringify(current));
      return Object.keys(current).length ? current : JSON.parse(sessionStorage.getItem(campaignKey) || "{}");
    } catch {
      return current;
    }
  };

  const campaign = readCampaign();
  const referrerHost = (() => {
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : "";
      return host && host !== location.hostname ? clean(host) : "";
    } catch {
      return "";
    }
  })();

  const track = (event, properties = {}) => {
    const payload = JSON.stringify({
      event: clean(event, 48),
      path: location.pathname,
      referrerHost,
      campaign,
      detail: clean(properties.detail || ""),
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      } else {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      // Analytics must never interrupt the visitor experience.
    }
  };

  window.oslTrack = track;
  window.addEventListener("osl:track", (event) => track(event.detail?.event, event.detail || {}));

  document.addEventListener("DOMContentLoaded", () => {
    track("page_view");

    document.querySelectorAll("input[name^='utm_']").forEach((input) => {
      input.value = campaign[input.name.replace("utm_", "")] || "";
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (/contact(?:\.html)?(?:[#?]|$)/.test(href)) track("cta_contact_click", { detail: link.textContent.trim() });
      if (/linkedin\.com/.test(href)) track("linkedin_click", { detail: link.textContent.trim() });
      if (/^https?:/.test(href) && !href.includes(location.hostname) && !/linkedin\.com/.test(href)) {
        track("outbound_click", { detail: new URL(href, location.href).hostname });
      }
      if (/\/musings\//.test(href)) track("article_open", { detail: href });
    });

    document.querySelectorAll("video").forEach((video) => {
      video.addEventListener("play", () => track("video_play", { detail: video.id || "video" }), { once: true });
    });

    const form = document.getElementById("contact-form");
    if (form) form.addEventListener("focusin", () => track("contact_started"), { once: true });

    if (document.body.classList.contains("post-template")) {
      const thresholds = new Set();
      addEventListener("scroll", () => {
        const available = document.documentElement.scrollHeight - innerHeight;
        if (available <= 0) return;
        const progress = scrollY / available;
        if (progress >= 0.5 && !thresholds.has(50)) {
          thresholds.add(50);
          track("article_read_50");
        }
        if (progress >= 0.9 && !thresholds.has(90)) {
          thresholds.add(90);
          track("article_read_90");
        }
      }, { passive: true });
    }
  });
})();
