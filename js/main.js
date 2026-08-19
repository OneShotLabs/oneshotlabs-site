// One Shot — shared behaviors, no dependencies.

document.addEventListener("DOMContentLoaded", () => {
  // Brand lockup: wrap the wordmark's text in its own span so the wordmark
  // lean (CSS, --oneshot-wordmark-lean, currently 0deg/fully upright)
  // applies to the letterforms only, leaving the gold underline this
  // element sits on top of perfectly horizontal. Done in JS once, here,
  // rather than hand-editing the span in all nine pages' header markup.
  document.querySelectorAll(".logo-text").forEach((el) => {
    if (el.querySelector(".logo-text-glyphs")) return;
    const glyphs = document.createElement("span");
    glyphs.className = "logo-text-glyphs";
    glyphs.textContent = el.textContent;
    el.textContent = "";
    el.appendChild(glyphs);
  });

  // Primary-logo gold shimmer: plays once per browser session (first
  // page viewed), not once per page load — every subsequent page in the
  // same session shows the settled gold immediately. Same session-gate
  // pattern as the splash screen.
  if (!sessionStorage.getItem("oneshot-brand-shimmer-seen")) {
    sessionStorage.setItem("oneshot-brand-shimmer-seen", "1");
    document.documentElement.classList.add("brand-shimmer-play");
  }

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const header = document.querySelector(".site-header");

  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (backdrop) backdrop.classList.toggle("is-visible", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () => {
      setOpen(!nav.classList.contains("open"));
    });

    if (backdrop) {
      backdrop.addEventListener("click", () => setOpen(false));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) setOpen(false);
    });

    // Close the drawer after tapping a link, and if the viewport is resized
    // past the drawer breakpoint while it's open.
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024 && nav.classList.contains("open")) setOpen(false);
    });
  }

  // Nav recedes on scroll down, reappears on scroll up.
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const goingDown = y > lastY;

          if (y > 120 && goingDown) {
            header.classList.add("nav-hidden");
            if (nav.classList.contains("open")) {
              nav.classList.remove("open"); // close mobile drawer if hiding
              toggle.setAttribute("aria-expanded", "false");
              if (backdrop) backdrop.classList.remove("is-visible");
              document.body.style.overflow = "";
            }
          } else {
            header.classList.remove("nav-hidden");
          }

          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // Reveal elements as they enter the viewport.
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
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
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Set current year in footer.
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Shutter hero: toggles the visual side between "photo" and "ai" panels.
  // Guarded on the presence of .shutter-panel so this only wires up on a
  // page that actually has the panel-swap hero (not the photography page's
  // own, separately-scoped .shutter-toggle instances).
  const shutterToggle = document.querySelector(".shutter-toggle");
  if (shutterToggle && document.querySelector(".shutter-panel")) {
    const buttons = shutterToggle.querySelectorAll(".shutter-toggle-btn");
    const panels = document.querySelectorAll(".shutter-panel");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;

        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });

        panels.forEach((p) => {
          p.classList.toggle("is-active", p.dataset.panel === mode);
        });

        shutterToggle.classList.toggle("mode-ai", mode === "ai");
      });
    });
  }

  // Contact form: posts to a real backend if data-endpoint is set (e.g. a
  // Formspree/serverless URL), otherwise falls back to a mailto handoff.
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const status = document.getElementById("contact-form-status");
    const submitBtn = document.getElementById("contact-form-submit");
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = contactForm.name.value.trim();
      const email = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      if (!name || !email || !message) {
        status.textContent = "Fill in every field before sending.";
        status.classList.add("is-error");
        return;
      }
      status.classList.remove("is-error");

      const endpoint = contactForm.dataset.endpoint;
      if (endpoint) {
        if (submitBtn) submitBtn.disabled = true;
        status.textContent = "Sending…";
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ name, email, message }),
          });
          if (!res.ok) throw new Error("Request failed");
          status.textContent = "Message sent — I'll get back to you soon.";
          contactForm.reset();
        } catch (err) {
          status.classList.add("is-error");
          status.textContent = "Something went wrong sending that. Try again, or email directly.";
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
        return;
      }

      const subject = encodeURIComponent(`New inquiry from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:oneshotlabsdj@gmail.com?subject=${subject}&body=${body}`;
      status.textContent = "Opening your email client to send this.";
      contactForm.reset();
    });
  }

  // Newsletter signup: standard Buttondown embed (plain POST + popup
  // confirmation), so it works with JS disabled. This just adds inline
  // status text to match the contact form's feedback pattern.
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    const nlStatus = document.getElementById("newsletter-form-status");
    newsletterForm.addEventListener("submit", (e) => {
      const email = newsletterForm.email.value.trim();
      if (!email) {
        e.preventDefault();
        nlStatus.textContent = "Enter an email to subscribe.";
        nlStatus.classList.add("is-error");
        return;
      }
      nlStatus.classList.remove("is-error");
      nlStatus.textContent = "Check the new tab to confirm your subscription.";
    });
  }

  // Patina intensity: apply any saved value sitewide, and wire up the slider
  // control when present (index page only).
  const root = document.documentElement;
  const savedPatina = localStorage.getItem("patina-intensity");
  if (savedPatina) root.style.setProperty("--patina-intensity", savedPatina);

  const patinaSlider = document.getElementById("patina-slider");
  if (patinaSlider) {
    if (savedPatina) patinaSlider.value = savedPatina;
    patinaSlider.addEventListener("input", () => {
      root.style.setProperty("--patina-intensity", patinaSlider.value);
      localStorage.setItem("patina-intensity", patinaSlider.value);
    });
  }

  // Logo icon: star (blades) and frame (corner brackets) scale sliders.
  [
    ["star-slider", "--star-scale"],
    ["frame-slider", "--frame-scale"],
  ].forEach(([id, prop]) => {
    const saved = localStorage.getItem(prop);
    if (saved) root.style.setProperty(prop, saved);
    const slider = document.getElementById(id);
    if (slider) {
      if (saved) slider.value = saved;
      slider.addEventListener("input", () => {
        root.style.setProperty(prop, slider.value);
        localStorage.setItem(prop, slider.value);
      });
    }
  });

  // Logo icon: corner-bracket roundness (rewrites the SVG arc paths directly).
  const cornerTemplates = [
    (r) => `M6,14 A${r},${r} 0 0 1 14,6`,
    (r) => `M86,6 A${r},${r} 0 0 1 94,14`,
    (r) => `M94,86 A${r},${r} 0 0 1 86,94`,
    (r) => `M14,94 A${r},${r} 0 0 1 6,86`,
  ];
  function applyCornerRadius(r) {
    const paths = document.querySelectorAll(".logo-icon .os-frame path");
    paths.forEach((p, i) => {
      if (cornerTemplates[i]) p.setAttribute("d", cornerTemplates[i](r));
    });
  }
  const cornerSlider = document.getElementById("corner-slider");
  if (cornerSlider) {
    const savedCorner = localStorage.getItem("--corner-radius");
    if (savedCorner) {
      cornerSlider.value = savedCorner;
      applyCornerRadius(savedCorner);
    }
    cornerSlider.addEventListener("input", () => {
      applyCornerRadius(cornerSlider.value);
      localStorage.setItem("--corner-radius", cornerSlider.value);
    });
  }

  // Footer flag mark: opacity slider.
  const savedFlag = localStorage.getItem("--flag-opacity");
  if (savedFlag) root.style.setProperty("--flag-opacity", savedFlag);
  const flagSlider = document.getElementById("flag-slider");
  if (flagSlider) {
    if (savedFlag) flagSlider.value = savedFlag;
    flagSlider.addEventListener("input", () => {
      root.style.setProperty("--flag-opacity", flagSlider.value);
      localStorage.setItem("--flag-opacity", flagSlider.value);
    });
  }

  // Tweak-panel collapse toggle.
  const patinaToggle = document.getElementById("patina-toggle");
  const patinaPanel = document.getElementById("patina-control");
  if (patinaToggle && patinaPanel) {
    patinaToggle.addEventListener("click", () => {
      const open = patinaPanel.classList.toggle("open");
      patinaToggle.setAttribute("aria-expanded", String(open));
    });
  }
});
