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

(() => {
  const grid = document.getElementById("selectedProjectsGrid");
  const toggle = document.getElementById("projectToggle");
  if (!grid || !toggle) return;

  const cards = Array.from(grid.querySelectorAll(".project-card"));
  const initialVisibleCount = 4;
  if (cards.length <= initialVisibleCount) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const extraCards = cards.slice(initialVisibleCount);
  const hiddenClassName = "project-card--hidden";
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const enterDuration = 300;
  const exitDuration = 220;
  const stagger = 30;
  let expanded = false;
  let animating = false;

  const setExpandedState = (isExpanded) => {
    cards.forEach((card, index) => {
      const shouldHide = !isExpanded && index >= initialVisibleCount;
      card.classList.toggle(hiddenClassName, shouldHide);
    });

    toggle.textContent = isExpanded ? "See fewer projects" : "See more projects";
    toggle.setAttribute("aria-expanded", String(isExpanded));
    expanded = isExpanded;
  };

  const runAnimations = async (animations) => {
    await Promise.all(
      animations.map((animation) =>
        animation.finished.catch(() => undefined)
      )
    );
  };

  const animateHeight = async (from, to, duration) => {
    if (prefersReducedMotion.matches || from === to) return;
    const animation = grid.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration, easing, fill: "forwards" }
    );

    await animation.finished.catch(() => undefined);
    animation.cancel();
  };

  const expandWithMotion = async () => {
    const startHeight = grid.getBoundingClientRect().height;
    extraCards.forEach((card) => card.classList.remove(hiddenClassName));
    const endHeight = grid.getBoundingClientRect().height;

    const cardAnimations = extraCards.map((card, index) =>
      card.animate(
        [
          { opacity: 0, transform: "translateY(12px) scale(0.99)", filter: "blur(1px)" },
          { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
        ],
        {
          duration: enterDuration,
          delay: index * stagger,
          easing,
          fill: "both",
        }
      )
    );

    await Promise.all([
      animateHeight(startHeight, endHeight, enterDuration + 60),
      runAnimations(cardAnimations),
    ]);
  };

  const collapseWithMotion = async () => {
    const startHeight = grid.getBoundingClientRect().height;

    const cardAnimations = [...extraCards]
      .reverse()
      .map((card, index) =>
        card.animate(
          [
            { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0)" },
            { opacity: 0, transform: "translateY(10px) scale(0.992)", filter: "blur(0.8px)" },
          ],
          {
            duration: exitDuration,
            delay: index * Math.round(stagger * 0.8),
            easing,
            fill: "both",
          }
        )
      );

    await runAnimations(cardAnimations);
    extraCards.forEach((card) => card.classList.add(hiddenClassName));
    const endHeight = grid.getBoundingClientRect().height;
    await animateHeight(startHeight, endHeight, exitDuration + 50);
  };

  setExpandedState(false);
  toggle.hidden = false;

  toggle.addEventListener("click", async () => {
    if (animating) return;
    animating = true;
    toggle.disabled = true;
    grid.classList.add("is-animating");

    try {
      if (prefersReducedMotion.matches) {
        setExpandedState(!expanded);
      } else if (!expanded) {
        await expandWithMotion();
        setExpandedState(true);
      } else {
        await collapseWithMotion();
        setExpandedState(false);
      }
    } finally {
      grid.classList.remove("is-animating");
      toggle.disabled = false;
      animating = false;
    }
  });
})();
