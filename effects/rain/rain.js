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
      button.classList.remove("is-on");
      button.classList.add("is-off");
      return;
    }
    button.removeAttribute("disabled");
    button.setAttribute("aria-pressed", String(settings.enabled));
    button.setAttribute("aria-label", settings.enabled ? "Turn rain off" : "Turn rain on");
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
        '<span class="icon icon-rain material-symbols-outlined" aria-hidden="true">rainy</span>' +
        '<span class="icon icon-umbrella material-symbols-outlined" aria-hidden="true">umbrella</span>';
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
