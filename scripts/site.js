(() => {
  // Always start in dark mode, independent of system preference.
  document.documentElement.setAttribute("data-theme", "dark");

  const clickSound = new Audio("assets/sounds/theme-click.mp3?v=3");
  clickSound.preload = "auto";
  clickSound.volume = 0.6;

  const playClick = () => {
    try {
      clickSound.currentTime = 0;
      const result = clickSound.play();
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (e) {
      // Silently ignore audio errors (e.g. autoplay policy)
    }
  };

  // Toggle on click
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      playClick();
    });
  }
})();

(() => {
  const currentEl = document.getElementById("heroRoleCurrent");
  const nextEl = document.getElementById("heroRoleNext");
  if (!currentEl || !nextEl) return;

  const roles = ["Product Designer", "B2B Systems", "UI Motion", "Figma \u2192 Code"];
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const dwellMs = 2400;
  const transitionMs = 520;
  let active = currentEl;
  let idle = nextEl;
  let index = 0;

  currentEl.textContent = roles[index];

  const tick = () => {
    const nextIndex = (index + 1) % roles.length;
    if (prefersReduced) {
      active.textContent = roles[nextIndex];
      index = nextIndex;
      return;
    }

    idle.textContent = roles[nextIndex];
    idle.classList.add("is-entering");
    active.classList.add("is-exiting");

    window.setTimeout(() => {
      active.classList.remove("is-active", "is-exiting", "is-entering");
      active.textContent = "";
      idle.classList.remove("is-entering");
      idle.classList.add("is-active");

      const previousActive = active;
      active = idle;
      idle = previousActive;
      index = nextIndex;
    }, transitionMs);
  };

  window.setInterval(tick, prefersReduced ? dwellMs : dwellMs + transitionMs);
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
        const contrib = document.querySelector(".contrib-wrap");
        if (contrib) {
          const rect = contrib.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          toast.style.top = center + "px";
          toast.style.bottom = "auto";
          toast.style.transform = "translateX(-50%) translateY(-50%)";
        }
        toast.classList.add("is-visible");
      }
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll, { passive: true });
})();

(() => {
  const grid = document.getElementById("selectedProjectsGrid");
  if (!grid) return;

  const projects = [
    {
      company: "Seedlegals",
      title: "AI Application Health Check",
      subtitle:
        "Embedded AI into the SEIS workflow to prevent errors before submission.",
      impact:
        "60%+ faster CX review turnaround by preventing errors before submission.",
      link: "https://tawfikmanham.com/project/ai-health-check-for-seis-eis-advance-assurance-applications/",
      imageSrc: "./assets/seedlegals-ai-health-check-11.png",
      imageAlt: "AI Application Health Check thumbnail",
      tags: ["B2B", "SaaS", "Startup", "Legal Tech"],
      cardClass: "project-card--with-impact",
      thumbClass: "project-thumb-wrap--seedlegals",
      subtitleClass: "project-subtitle--with-impact",
    },
    {
      company: "Nazacare",
      title: "Care Home Management Platform",
      subtitle:
        "Designed a 0→1 B2B care management platform replacing fragmented Google Drive workflows.",
      impact:
        "Unified rota planning, staff leave, medication tracking, and resident oversight into a single source of truth.",
      link: "https://tawfikmanham.com/project/naza-care-connect-web/",
      imageSrc: "./assets/naza-care-01.png",
      imageAlt: "Naza Care Connect thumbnail",
      tags: ["B2B", "SaaS", "Healthcare"],
      cardClass: "project-card--with-impact",
      thumbClass: "project-thumb-wrap--nazacare",
      subtitleClass: "project-subtitle--with-impact",
    },
    {
      company: "Trimble",
      title: "Fleet Enterprise Mobility Platform",
      subtitle:
        "Designed and launched a 0→1 SaaS system for managing driver devices across large scale fleets.",
      impact:
        "£500K+ generated in Q1 through expansion into new markets.",
      link: "https://tawfikmanham.com/project/trimble-app-manager/",
      imageSrc: "./assets/tam-01.png",
      imageAlt: "Trimble App Manager thumbnail",
      tags: ["B2B", "SaaS", "Transportation and Logistics", "Web"],
      cardClass: "project-card--with-impact",
      thumbClass: "project-thumb-wrap--tam",
      subtitleClass: "project-subtitle--with-impact",
    },
    {
      company: "Trimble",
      title: "Driver Experience Platform",
      subtitle:
        "Led UX audit and streamlined integrated driver workflows across messaging, trips, navigation, and hours of service.",
      impact:
        "NPS improved from 6.8 to 8.2 (20% uplift).",
      link: "https://tawfikmanham.com/project/driver-workflow/",
      imageSrc: "./assets/driver-workflow-02.png",
      imageAlt: "Driver Workflow thumbnail",
      tags: ["B2C", "SaaS", "Transportation and Logistics", "Mobile"],
      cardClass: "project-card--with-impact",
      thumbClass: "project-thumb-wrap--driver",
      subtitleClass: "project-subtitle--with-impact",
    },
    {
      company: "Trimble",
      title: "Trimble Modus",
      subtitle: "Unified design system and micro-interactions at scale.",
      link: "https://tawfikmanham.com/project/trimble-modus/",
      imageSrc: "./assets/trimble-modus-02.png",
      imageAlt: "Trimble Modus thumbnail",
      tags: ["Web", "Design System"],
      thumbClass: "project-thumb-wrap--modus",
    },
  ];

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const renderImpactBlock = ({ subtitle, impact, subtitleClass = "" }) => {
    const subtitleClasses = ["project-subtitle", subtitleClass].filter(Boolean).join(" ");
    if (!impact) {
      return `<p class="${subtitleClasses}">${escapeHtml(subtitle)}</p>`;
    }

    return `<p class="${subtitleClasses}"><span class="subtitle-main">${escapeHtml(
      subtitle
    )}</span><span class="impact-line">${escapeHtml(impact)}</span></p>`;
  };

  const renderProjectCard = (project) => {
    const cardClasses = ["project-card", project.cardClass].filter(Boolean).join(" ");
    const tagsMarkup = project.tags
      .map((tag) => `<span class="project-tag">${escapeHtml(tag)}</span>`)
      .join("");

    return `
      <a class="${cardClasses}" href="${escapeHtml(project.link)}" target="_blank" rel="noopener">
        <div class="project-thumb-wrap ${escapeHtml(project.thumbClass)}">
          <img class="project-thumb" src="${escapeHtml(project.imageSrc)}" alt="${escapeHtml(
      project.imageAlt
    )}">
        </div>
        <div class="project-meta">
          <div class="project-company">${escapeHtml(project.company)}</div>
          <div class="project-title">${escapeHtml(project.title)}</div>
          ${renderImpactBlock(project)}
          <div class="project-tags" aria-label="Project tags">${tagsMarkup}</div>
        </div>
      </a>
    `;
  };

  grid.innerHTML = projects.map(renderProjectCard).join("");
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
