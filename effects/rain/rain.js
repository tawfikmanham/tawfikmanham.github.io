(() => {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;

  const canvas = document.createElement("canvas");
  canvas.className = "rain-overlay";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let drops = [];
  let isAnimating = false;
  let rafId = 0;
  let lastTime = 0;
  let elapsed = 0;
  let audioCtx = null;
  let noiseSource = null;
  let noiseGain = null;

  const settings = {
    enabled: false,
    density: 0.00028,
    minDrops: 180,
    lengthMin: 14,
    lengthMax: 34,
    speedMin: 9,
    speedMax: 22,
    thicknessMin: 0.7,
    thicknessMax: 1.45,
    opacityMin: 0.16,
    opacityMax: 0.56,
    driftMin: -0.35,
    driftMax: 0.35,
    windBase: 0.08,
    windGustAmp: 0.32,
    windGustFreq: 0.00042,
    swayAmpMin: 0.015,
    swayAmpMax: 0.09,
    swayFreqMin: 0.0012,
    swayFreqMax: 0.0026,
    streakLean: 2.6,
    color: { r: 200, g: 200, b: 200 },
    umbrellaRadiusDesktop: 120,
    umbrellaRadiusMobile: 80,
    umbrellaFeatherRatio: 0.35,
    audioEnabled: true,
    audioVolume: 0.08,
    audioLowpass: 1200,
    audioHighpass: 180,
  };

  const cursor = {
    x: -9999,
    y: -9999,
    radius: settings.umbrellaRadiusDesktop,
    feather: Math.round(settings.umbrellaRadiusDesktop * settings.umbrellaFeatherRatio),
  };

  const setUmbrellaSize = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    cursor.radius = isMobile ? settings.umbrellaRadiusMobile : settings.umbrellaRadiusDesktop;
    cursor.feather = Math.round(cursor.radius * settings.umbrellaFeatherRatio);
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area = width * height;
    const dropCount = Math.max(settings.minDrops, Math.floor(area * settings.density));
    drops = Array.from({ length: dropCount }, () => createDrop());
    setUmbrellaSize();
  };

  const createDrop = () => {
    const lengthMin = Math.min(settings.lengthMin, settings.lengthMax);
    const lengthMax = Math.max(settings.lengthMin, settings.lengthMax);
    const speedMin = Math.min(settings.speedMin, settings.speedMax);
    const speedMax = Math.max(settings.speedMin, settings.speedMax);
    const thicknessMin = Math.min(settings.thicknessMin, settings.thicknessMax);
    const thicknessMax = Math.max(settings.thicknessMin, settings.thicknessMax);
    const opacityMin = Math.min(settings.opacityMin, settings.opacityMax);
    const opacityMax = Math.max(settings.opacityMin, settings.opacityMax);
    const driftMin = Math.min(settings.driftMin, settings.driftMax);
    const driftMax = Math.max(settings.driftMin, settings.driftMax);
    const depth = Math.pow(Math.random(), 1.35);
    const length = random(lengthMin, lengthMax) * (0.72 + depth * 0.7);
    const speed = random(speedMin, speedMax) * (0.58 + depth * 1.05);
    const thickness = random(thicknessMin, thicknessMax) * (0.75 + depth * 0.65);
    const opacity = random(opacityMin, opacityMax) * (0.64 + depth * 0.5);
    const drift = random(driftMin, driftMax) * (0.55 + depth * 0.75);
    return {
      x: random(0, width),
      y: random(-height, height),
      depth,
      length,
      speed,
      thickness,
      opacity,
      drift,
      swayAmp: random(settings.swayAmpMin, settings.swayAmpMax),
      swayFreq: random(settings.swayFreqMin, settings.swayFreqMax),
      swayPhase: random(0, Math.PI * 2),
      vx: 0,
    };
  };

  const random = (min, max) => min + Math.random() * (max - min);

  const resetDrop = (d, spawnAbove = true) => {
    const fresh = createDrop();
    d.x = random(0, width);
    d.y = spawnAbove ? -fresh.length - random(0, height * 0.25) : random(-height, height);
    d.depth = fresh.depth;
    d.length = fresh.length;
    d.speed = fresh.speed;
    d.thickness = fresh.thickness;
    d.opacity = fresh.opacity;
    d.drift = fresh.drift;
    d.swayAmp = fresh.swayAmp;
    d.swayFreq = fresh.swayFreq;
    d.swayPhase = fresh.swayPhase;
    d.vx = 0;
  };

  const updateDrops = (dtMs, nowMs) => {
    const frameScale = Math.min(2.1, Math.max(0.35, dtMs / (1000 / 60)));
    const gust = settings.windBase + Math.sin(nowMs * settings.windGustFreq) * settings.windGustAmp;

    for (const d of drops) {
      const sway = Math.sin(nowMs * d.swayFreq + d.swayPhase) * d.swayAmp;
      d.vx = (d.drift + gust * (0.45 + d.depth * 0.9) + sway) * frameScale;
      d.y += d.speed * frameScale;
      d.x += d.vx;

      if (d.y > height + d.length) {
        resetDrop(d, true);
      }

      if (d.x < -50) d.x = width + 50;
      if (d.x > width + 50) d.x = -50;
    }
  };

  const drawDrops = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";

    for (const d of drops) {
      const dx = d.x - cursor.x;
      const dy = d.y - cursor.y;
      const dist = Math.hypot(dx, dy);
      let alpha = d.opacity;

      if (dist < cursor.radius) {
        const edgeStart = Math.max(0, cursor.radius - cursor.feather);
        if (dist <= edgeStart) {
          alpha = 0;
        } else {
          const t = (dist - edgeStart) / cursor.feather;
          alpha *= t;
        }
      }

      if (alpha <= 0.01) {
        continue;
      }

      const depthAlpha = alpha * (0.62 + d.depth * 0.72);
      const tailX = d.x + d.vx * settings.streakLean;
      const tailY = d.y + d.length;
      const haloAlpha = Math.min(0.24, depthAlpha * 0.45);

      if (d.depth > 0.58) {
        ctx.strokeStyle = `rgba(${settings.color.r}, ${settings.color.g}, ${settings.color.b}, ${haloAlpha})`;
        ctx.lineWidth = d.thickness + 0.9;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(${settings.color.r}, ${settings.color.g}, ${settings.color.b}, ${Math.min(0.92, depthAlpha)})`;
      ctx.lineWidth = d.thickness;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
  };

  const tick = (nowMs) => {
    if (!isAnimating) {
      return;
    }
    if (!lastTime) {
      lastTime = nowMs;
    }
    const dtMs = nowMs - lastTime;
    lastTime = nowMs;
    elapsed = nowMs;

    updateDrops(dtMs, elapsed);
    drawDrops();
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    isAnimating = false;
    lastTime = 0;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    ctx.clearRect(0, 0, width, height);
    stopAudio();
  };

  const start = () => {
    if (isAnimating || reduceMotion || !settings.enabled) {
      return;
    }
    isAnimating = true;
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  };

  const createNoiseBuffer = (context) => {
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.5;
    }
    return buffer;
  };

  const startAudio = () => {
    if (audioCtx || reduceMotion || !settings.enabled || !settings.audioEnabled) {
      return;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioCtx);
    noiseSource.loop = true;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = settings.audioLowpass;

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = settings.audioHighpass;

    noiseGain = audioCtx.createGain();
    noiseGain.gain.value = settings.audioVolume;

    noiseSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseSource.start(0);
  };

  const stopAudio = () => {
    if (!audioCtx) {
      return;
    }
    if (noiseSource) {
      noiseSource.stop(0);
      noiseSource.disconnect();
      noiseSource = null;
    }
    if (noiseGain) {
      noiseGain.disconnect();
      noiseGain = null;
    }
    audioCtx.close();
    audioCtx = null;
  };

  const handlePointer = (event) => {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
  };

  const updateToggle = (button) => {
    if (reduceMotion) {
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("disabled", "true");
      button.setAttribute("aria-label", "Rain disabled");
      button.setAttribute("data-tooltip", "Rain disabled");
      button.classList.remove("is-on");
      button.classList.add("is-off");
      return;
    }
    button.removeAttribute("disabled");
    button.setAttribute("aria-pressed", String(settings.enabled));
    const label = settings.enabled ? "Turn rain off" : "Turn rain on";
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip", label);
    button.classList.toggle("is-on", settings.enabled);
    button.classList.toggle("is-off", !settings.enabled);
  };

  const initToggle = () => {
    let button = document.getElementById("rainToggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "rainToggle";
      button.className = "rain-toggle";
      button.type = "button";
      button.innerHTML =
        '<svg class="icon icon-rain" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<path d="M13.95 21.9C13.7 22.0333 13.4458 22.0542 13.1875 21.9625C12.9292 21.8708 12.7333 21.7 12.6 21.45L11.1 18.45C10.9667 18.2 10.9458 17.9458 11.0375 17.6875C11.1292 17.4292 11.3 17.2333 11.55 17.1C11.8 16.9667 12.0542 16.9458 12.3125 17.0375C12.5708 17.1292 12.7667 17.3 12.9 17.55L14.4 20.55C14.5333 20.8 14.5542 21.0542 14.4625 21.3125C14.3708 21.5708 14.2 21.7667 13.95 21.9ZM19.95 21.9C19.7 22.0333 19.4458 22.0542 19.1875 21.9625C18.9292 21.8708 18.7333 21.7 18.6 21.45L17.1 18.45C16.9667 18.2 16.9458 17.9458 17.0375 17.6875C17.1292 17.4292 17.3 17.2333 17.55 17.1C17.8 16.9667 18.0542 16.9458 18.3125 17.0375C18.5708 17.1292 18.7667 17.3 18.9 17.55L20.4 20.55C20.5333 20.8 20.5542 21.0542 20.4625 21.3125C20.3708 21.5708 20.2 21.7667 19.95 21.9ZM7.95 21.9C7.7 22.0333 7.44583 22.0542 7.1875 21.9625C6.92917 21.8708 6.73333 21.7 6.6 21.45L5.1 18.45C4.96667 18.2 4.94583 17.9458 5.0375 17.6875C5.12917 17.4292 5.3 17.2333 5.55 17.1C5.8 16.9667 6.05417 16.9458 6.3125 17.0375C6.57083 17.1292 6.76667 17.3 6.9 17.55L8.4 20.55C8.53333 20.8 8.55417 21.0542 8.4625 21.3125C8.37083 21.5708 8.2 21.7667 7.95 21.9ZM7.5 16C5.98333 16 4.6875 15.4625 3.6125 14.3875C2.5375 13.3125 2 12.0167 2 10.5C2 9.11667 2.45833 7.90833 3.375 6.875C4.29167 5.84167 5.425 5.23333 6.775 5.05C7.30833 4.1 8.0375 3.35417 8.9625 2.8125C9.8875 2.27083 10.9 2 12 2C13.5 2 14.8042 2.47917 15.9125 3.4375C17.0208 4.39583 17.6917 5.59167 17.925 7.025C19.075 7.125 20.0417 7.6 20.825 8.45C21.6083 9.3 22 10.3167 22 11.5C22 12.75 21.5625 13.8125 20.6875 14.6875C19.8125 15.5625 18.75 16 17.5 16H7.5ZM7.5 14H17.5C18.2 14 18.7917 13.7583 19.275 13.275C19.7583 12.7917 20 12.2 20 11.5C20 10.8 19.7583 10.2083 19.275 9.725C18.7917 9.24167 18.2 9 17.5 9H16V8C16 6.9 15.6083 5.95833 14.825 5.175C14.0417 4.39167 13.1 4 12 4C11.2 4 10.4708 4.21667 9.8125 4.65C9.15417 5.08333 8.65833 5.66667 8.325 6.4L8.075 7H7.45C6.5 7.03333 5.6875 7.3875 5.0125 8.0625C4.3375 8.7375 4 9.55 4 10.5C4 11.4667 4.34167 12.2917 5.025 12.975C5.70833 13.6583 6.53333 14 7.5 14Z" fill="currentColor"/>' +
        '</svg>' +
        '<svg class="icon icon-umbrella" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<path d="M11.4375 21.8375C11.2625 21.7292 11.1333 21.5583 11.05 21.325L6 6.075L9.5 6.925L11 5.775V3.4C11 2.73333 11.2417 2.16667 11.725 1.7C12.2083 1.23333 12.8 1 13.5 1C14.2 1 14.7917 1.23333 15.275 1.7C15.7583 2.16667 16 2.73333 16 3.4V4H14V3.4C14 3.26667 13.95 3.15417 13.85 3.0625C13.75 2.97083 13.6333 2.925 13.5 2.925C13.3667 2.925 13.25 2.97083 13.15 3.0625C13.05 3.15417 13 3.26667 13 3.4V5.775L14.5 6.925L18 6.075L12.95 21.3C12.8667 21.5333 12.7375 21.7083 12.5625 21.825C12.3875 21.9417 12.2 22 12 22C11.8 22 11.6125 21.9458 11.4375 21.8375ZM13 14.8L14.95 8.85L14.05 9.075L13 8.3V14.8ZM11 14.8V8.3L9.95 9.1L9.025 8.85L11 14.8Z" fill="currentColor"/>' +
        '</svg>';
      const themeToggle = document.getElementById("themeToggle");
      if (themeToggle && themeToggle.parentNode) {
        themeToggle.parentNode.insertBefore(button, themeToggle);
      } else {
        document.body.appendChild(button);
      }
    }

    updateToggle(button);
    button.addEventListener("click", () => {
      if (reduceMotion) {
        return;
      }
      settings.enabled = !settings.enabled;
      updateToggle(button);
      if (settings.enabled) {
        resize();
        start();
        startAudio();
      } else {
        stop();
      }
    });
  };

  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("pointerdown", handlePointer, { passive: true });
  window.addEventListener("pointerleave", () => {
    cursor.x = -9999;
    cursor.y = -9999;
  });

  window.addEventListener("resize", resize);
  reduceMotionQuery.addEventListener("change", (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      settings.enabled = false;
      stop();
      return;
    }
    resize();
    start();
    startAudio();
  });

  resize();
  initToggle();
  if (settings.enabled) {
    start();
    startAudio();
  }

})();
