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
  let isEnabled = !reduceMotion;
  let rafId = 0;
  let audioCtx = null;
  let noiseSource = null;
  let noiseGain = null;

  const cursor = {
    x: -9999,
    y: -9999,
    radius: 120,
    feather: 40,
  };

  const setUmbrellaSize = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    cursor.radius = isMobile ? 80 : 120;
    cursor.feather = Math.round(cursor.radius * 0.35);
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
    const dropCount = Math.max(220, Math.floor(area * 0.00035));
    drops = Array.from({ length: dropCount }, () => createDrop());
    setUmbrellaSize();
  };

  const createDrop = () => {
    const length = random(12, 26);
    return {
      x: random(0, width),
      y: random(-height, height),
      length,
      speed: random(8, 16),
      thickness: random(1, 1.6),
      opacity: random(0.35, 0.7),
      drift: random(-0.7, 0.7),
    };
  };

  const random = (min, max) => min + Math.random() * (max - min);

  const updateDrops = () => {
    for (const d of drops) {
      d.y += d.speed;
      d.x += d.drift;

      if (d.y > height + d.length) {
        d.y = -d.length;
        d.x = random(0, width);
      }

      if (d.x < -20) d.x = width + 20;
      if (d.x > width + 20) d.x = -20;
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

      ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
      ctx.lineWidth = d.thickness;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.drift * 2, d.y + d.length);
      ctx.stroke();
    }
  };

  const tick = () => {
    if (!isAnimating) {
      return;
    }
    updateDrops();
    drawDrops();
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    isAnimating = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    ctx.clearRect(0, 0, width, height);
    stopAudio();
  };

  const start = () => {
    if (isAnimating || reduceMotion || !isEnabled) {
      return;
    }
    isAnimating = true;
    tick();
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
    if (audioCtx || reduceMotion || !isEnabled) {
      return;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioCtx);
    noiseSource.loop = true;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1200;

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 180;

    noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.08;

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
    button.setAttribute("aria-pressed", String(isEnabled));
    button.setAttribute("aria-label", isEnabled ? "Turn rain off" : "Turn rain on");
    button.classList.toggle("is-on", isEnabled);
    button.classList.toggle("is-off", !isEnabled);
  };

  const initToggle = () => {
    let button = document.getElementById("rainToggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "rainToggle";
      button.className = "rain-toggle";
      button.type = "button";
      button.innerHTML =
        '<span class="icon icon-rain" aria-hidden="true">🌧️</span>' +
        '<span class="icon icon-umbrella" aria-hidden="true">☔️</span>';
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
      isEnabled = !isEnabled;
      updateToggle(button);
      if (isEnabled) {
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
      isEnabled = false;
      stop();
      return;
    }
    isEnabled = true;
    resize();
    start();
    startAudio();
  });

  resize();
  initToggle();
  if (isEnabled) {
    start();
    startAudio();
  }
})();
