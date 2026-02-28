(() => {
  // Set initial theme (saved > system preference)
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = saved || (prefersDark ? "dark" : "light");

  document.documentElement.setAttribute("data-theme", initialTheme);

  // Toggle on click
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
})();

(() => {
  // Typewriter subcopy (header only)
  const el = document.getElementById("typewriter");
  if (!el) return;

  const textEl = el.querySelector(".typewriter-text");
  const cursorEl = el.querySelector(".typewriter-cursor");
  const lines = [
    "9 years building B2B products",
    "B2B SaaS product design",
    "Design and code thinking",
    "Designing for scale",
    "Design systems and workflows",
  ];

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    if (textEl) textEl.textContent = lines[0];
    if (cursorEl) cursorEl.style.display = "none";
    el.classList.add("is-ready");
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typingSpeed = 52;
  const deletingSpeed = 32;
  const pauseAfterTyping = 1400;
  const pauseAfterDeleting = 400;

  const tick = () => {
    const current = lines[lineIndex];
    if (!textEl) return;

    if (!isDeleting) {
      charIndex += 1;
      textEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        isDeleting = true;
        setTimeout(tick, pauseAfterTyping);
        return;
      }
      setTimeout(tick, typingSpeed);
    } else {
      charIndex -= 1;
      textEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        isDeleting = false;
        lineIndex = (lineIndex + 1) % lines.length;
        setTimeout(tick, pauseAfterDeleting);
        return;
      }
      setTimeout(tick, deletingSpeed);
    }
  };

  const start = () => {
    el.classList.add("is-ready");
    tick();
  };

  setTimeout(start, 520);
})();

(() => {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotionQuery.matches) {
    return;
  }

  let hasFired = false;
  const toast = document.getElementById("bottomToast");
  const toastButton = toast ? toast.querySelector("button") : null;

  if (toastButton) {
    toastButton.addEventListener("click", () => {
      toast.classList.remove("is-visible");
    });
  }

  const onScroll = () => {
    if (hasFired) return;
    const threshold = 12;
    const scrollBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - threshold;
    if (scrollBottom) {
      hasFired = true;
      if (toast) {
        toast.classList.add("is-visible");
      }
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll, { passive: true });
})();

(() => {
  const svg = document.querySelector(".footer-wordmark-svg");
  if (!svg) return;

  const text = svg.querySelector("text");
  if (!text) return;

  const fitFooterWordmark = () => {
    try {
      const box = text.getBBox();
      if (!box.width || !box.height) return;

      // Fit to actual glyph bounds so the wordmark scales with container width,
      // matching the same central content width as the project cards.
      svg.setAttribute(
        "viewBox",
        `${box.x} ${box.y} ${box.width} ${box.height}`
      );
    } catch (_) {
      // Ignore transient measurement errors during initial render.
    }
  };

  fitFooterWordmark();
  window.addEventListener("load", fitFooterWordmark, { passive: true });
  window.addEventListener("resize", fitFooterWordmark, { passive: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitFooterWordmark);
  }
})();
