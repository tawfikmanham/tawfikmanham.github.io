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
  const canvas = document.getElementById("footerWordmarkCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const offscreen = document.createElement("canvas");
  const offscreenCtx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!offscreenCtx) return;

  const cfg = {
    text: "MANHAM",
    dotSize: 1.8, // Dot size in CSS px.
    dotSizeJitter: 0.85, // Halftone size variance.
    density: 3, // Lower value means more particles.
    alphaThreshold: 100, // Text sampling threshold.
    color: "#AB1F26",
    baseAlpha: 0.78,
    repelRadius: 84, // Mouse influence radius.
    returnSpeed: 0.02, // Base return speed once easing starts.
    returnDelayMs: 220, // Delay before particles begin returning.
    returnEaseInMs: 520, // Ease-in window for return force.
    friction: 0.88,
    shimmerAmplitude: 0.45,
    shimmerFrequency: 0.02,
    shimmerSpeed: 0.0025,
    maxDisplacement: 96, // Increased by 80px from previous 16px.
    scatterApproachSpeed: 0.08, // How quickly particles move toward random scatter targets.
    scatterHoldMs: 320, // How long random scatter stays before returning.
    scatterJitterMs: 220, // Random extra hold duration.
    scatterCooldownMs: 120, // Prevents re-randomizing the same particle every frame.
  };

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;
  let particles = [];
  let rafId = 0;
  let resizeDebounceId = 0;
  let pointer = {
    x: 0,
    y: 0,
    inside: false,
    activeUntil: 0,
  };

  const requestRender = () => {
    if (!rafId && !reduceMotion) {
      rafId = window.requestAnimationFrame(frame);
    }
  };

  const easeInQuad = (t) => t * t;

  const fitFontSize = (width, height) => {
    const measureCtx = document.createElement("canvas").getContext("2d");
    if (!measureCtx) return 0;

    let low = 24;
    let high = Math.floor(height * 0.9);
    let best = low;

    while (low <= high) {
      const mid = (low + high) >> 1;
      measureCtx.font = `900 ${mid}px Arial Black, Arial, sans-serif`;
      const textWidth = measureCtx.measureText(cfg.text).width;
      if (textWidth <= width * 0.9 && mid <= height * 0.85) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return best;
  };

  const drawStatic = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = cfg.color;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      ctx.globalAlpha = p.baseAlpha;
      ctx.fillRect(
        Math.round(p.homeX),
        Math.round(p.homeY),
        p.baseSize,
        p.baseSize
      );
    }

    ctx.globalAlpha = 1;
  };

  const drawAnimated = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = cfg.color;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      ctx.globalAlpha = p.renderAlpha;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.renderSize, p.renderSize);
    }
    ctx.globalAlpha = 1;
  };

  const buildParticles = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    offscreen.width = width;
    offscreen.height = height;
    offscreenCtx.clearRect(0, 0, width, height);

    const fontSize = fitFontSize(width, height);
    offscreenCtx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;
    offscreenCtx.textAlign = "center";
    offscreenCtx.textBaseline = "middle";
    offscreenCtx.fillStyle = "#fff";
    offscreenCtx.fillText(cfg.text, width * 0.5, height * 0.56);

    const image = offscreenCtx.getImageData(0, 0, width, height).data;
    const samplePoints = [];

    for (let y = 0; y < height; y += cfg.density) {
      for (let x = 0; x < width; x += cfg.density) {
        const alpha = image[(y * width + x) * 4 + 3];
        if (alpha >= cfg.alphaThreshold) {
          samplePoints.push({ x, y });
        }
      }
    }

    if (!samplePoints.length) {
      particles = [];
      drawStatic();
      return;
    }

    particles = samplePoints.map((point) => {
      const halftoneBand = ((point.x / cfg.density + point.y / cfg.density) % 3) / 2;
      const randomSize = 1 - cfg.dotSizeJitter * 0.5 + Math.random() * cfg.dotSizeJitter;
      const baseSize = cfg.dotSize * (0.78 + halftoneBand * 0.3) * randomSize;
      return {
        x: point.x,
        y: point.y,
        homeX: point.x,
        homeY: point.y,
        vx: 0,
        vy: 0,
        baseAlpha: cfg.baseAlpha + Math.random() * 0.2,
        baseSize: Math.max(0.7, baseSize),
        renderAlpha: cfg.baseAlpha + Math.random() * 0.2,
        renderSize: Math.max(0.7, baseSize),
        phase: Math.random() * Math.PI * 2,
        returnReadyAt: 0,
        scatterX: point.x,
        scatterY: point.y,
        scatterUntil: 0,
        nextScatterAt: 0,
      };
    });

    drawStatic();
    requestRender();
  };

  const updateParticles = (now) => {
    const pointerActive = now < pointer.activeUntil;
    const radiusSq = cfg.repelRadius * cfg.repelRadius;
    let activeCount = 0;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const shimmerOffset = pointer.inside
        ? Math.sin(now * cfg.shimmerSpeed + p.homeY * cfg.shimmerFrequency + p.phase) * cfg.shimmerAmplitude
        : 0;

      const targetX = p.homeX + shimmerOffset;
      const targetY = p.homeY;
      let desiredX = targetX;
      let desiredY = targetY;

      if (pointerActive) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0.0001 && distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          if (now >= p.nextScatterAt) {
            const proximity = 1 - dist / cfg.repelRadius;
            const angle = Math.random() * Math.PI * 2;
            const magnitude = cfg.maxDisplacement * (0.25 + Math.random() * 0.75) * proximity;
            p.scatterX = p.homeX + Math.cos(angle) * magnitude;
            p.scatterY = p.homeY + Math.sin(angle) * magnitude;
            p.scatterUntil = now + cfg.scatterHoldMs + Math.random() * cfg.scatterJitterMs;
            p.returnReadyAt = p.scatterUntil + cfg.returnDelayMs;
            p.nextScatterAt = now + cfg.scatterCooldownMs + Math.random() * 120;
          }
        }
      }

      if (now < p.scatterUntil) {
        desiredX = p.scatterX;
        desiredY = p.scatterY;
        p.vx += (desiredX - p.x) * cfg.scatterApproachSpeed;
        p.vy += (desiredY - p.y) * cfg.scatterApproachSpeed;
      } else {
        const returnElapsed = now - p.returnReadyAt;
        const returnEase = p.returnReadyAt > 0
          ? Math.min(1, Math.max(0, returnElapsed / cfg.returnEaseInMs))
          : 1;
        const returnStrength = cfg.returnSpeed * easeInQuad(returnEase);
        p.vx += (desiredX - p.x) * returnStrength;
        p.vy += (desiredY - p.y) * returnStrength;
      }
      p.vx *= cfg.friction;
      p.vy *= cfg.friction;

      p.x += p.vx;
      p.y += p.vy;

      // Cap total displacement from home to keep motion subtle.
      const offsetX = p.x - p.homeX;
      const offsetY = p.y - p.homeY;
      const offsetLength = Math.hypot(offsetX, offsetY);
      if (offsetLength > cfg.maxDisplacement) {
        const ratio = cfg.maxDisplacement / offsetLength;
        p.x = p.homeX + offsetX * ratio;
        p.y = p.homeY + offsetY * ratio;
        p.vx *= 0.5;
        p.vy *= 0.5;
      }

      p.renderAlpha = p.baseAlpha;
      p.renderSize = p.baseSize;

      const isMoving =
        Math.abs(p.vx) + Math.abs(p.vy) > 0.018 ||
        Math.abs(p.x - desiredX) + Math.abs(p.y - desiredY) > 0.08;
      if (isMoving) {
        activeCount += 1;
      }
    }

    return pointer.inside || pointerActive || activeCount > 0;
  };

  const frame = (now) => {
    rafId = 0;
    if (reduceMotion) return;

    const shouldContinue = updateParticles(now);
    drawAnimated();
    if (shouldContinue) {
      requestRender();
    }
  };

  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.activeUntil = performance.now() + 90;
  };

  canvas.addEventListener("pointerenter", (event) => {
    if (reduceMotion) return;
    pointer.inside = true;
    updatePointer(event);
    requestRender();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    updatePointer(event);
    requestRender();
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.inside = false;
    pointer.activeUntil = 0;
    requestRender();
  });

  const rebuildWithDebounce = () => {
    window.clearTimeout(resizeDebounceId);
    resizeDebounceId = window.setTimeout(buildParticles, 140);
  };

  window.addEventListener("resize", rebuildWithDebounce, { passive: true });

  reduceMotionQuery.addEventListener("change", (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x = p.homeX;
        p.y = p.homeY;
        p.vx = 0;
        p.vy = 0;
      }
      drawStatic();
      return;
    }

    requestRender();
  });

  buildParticles();
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
