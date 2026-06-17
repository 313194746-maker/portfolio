const sections = [...document.querySelectorAll("main section[id], footer[id]")];
const navLinks = [...document.querySelectorAll(".top-nav nav a:not(.nav-cta)")];
const swipeMode = Boolean(
  window.gsap &&
  window.Observer &&
  window.matchMedia("(prefers-reduced-motion: no-preference)").matches
);

if (swipeMode) {
  document.body.classList.add("gsap-swipe-enabled");
}

function initGradientBlinds() {
  const canvas = document.querySelector("#gradient-blinds-canvas");
  const hero = canvas?.closest(".hero");
  if (!canvas || !hero) return;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform vec3 iResolution;
    uniform vec2 iMouse;
    uniform float iTime;
    uniform float uBlindCount;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = fragCoord.xy / iResolution.xy;

      vec3 color1 = vec3(0.129411765, 0.580392157, 0.984313725);
      vec3 color2 = vec3(0.552941176, 0.156862745, 1.0);
      vec3 base = mix(color1, color2, clamp(uv.x, 0.0, 1.0));

      vec2 spotlightCenter = vec2(iMouse.x / iResolution.x, iMouse.y / iResolution.y);
      float distanceToSpotlight = length(uv - spotlightCenter);
      float normalizedDistance = distanceToSpotlight / 0.6;
      float spotlight = 1.0 - 2.0 * pow(normalizedDistance, 1.0);

      float stripe = fract(uv.x * max(uBlindCount, 1.0));
      vec3 color = vec3(spotlight) + base - vec3(stripe);
      color += (rand(gl_FragCoord.xy + iTime) - 0.5) * 0.33;

      fragColor = vec4(color, 1.0);
    }

    void main() {
      vec4 color;
      mainImage(color, gl_FragCoord.xy);
      gl_FragColor = color;
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  gl.useProgram(program);
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionLocation = gl.getUniformLocation(program, "iResolution");
  const mouseLocation = gl.getUniformLocation(program, "iMouse");
  const timeLocation = gl.getUniformLocation(program, "iTime");
  const blindCountLocation = gl.getUniformLocation(program, "uBlindCount");

  const targetMouse = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let blindCount = 18;
  let firstResize = true;
  let lastTime = 0;
  let lastFrameTime = 0;
  let raf = 0;
  let rendering = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    blindCount = Math.max(1, Math.min(18, Math.floor(rect.width / 60)));
    if (firstResize) {
      firstResize = false;
      mouse.x = width / 2;
      mouse.y = height / 2;
      targetMouse.x = mouse.x;
      targetMouse.y = mouse.y;
    }
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / Math.max(1, rect.width);
    const scaleY = height / Math.max(1, rect.height);
    targetMouse.x = (event.clientX - rect.left) * scaleX;
    targetMouse.y = (rect.height - (event.clientY - rect.top)) * scaleY;
  }

  hero.addEventListener("pointermove", updatePointer, { passive: true });

  function render(now) {
    if (!rendering) return;
    raf = requestAnimationFrame(render);
    if (now - lastFrameTime < 1000 / 60) return;
    lastFrameTime = now;

    if (!lastTime) lastTime = now;
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    const damping = 1 - Math.exp(-deltaTime / 0.31);
    mouse.x += (targetMouse.x - mouse.x) * damping;
    mouse.y += (targetMouse.y - mouse.y) * damping;

    gl.uniform3f(resolutionLocation, width, height, 1);
    gl.uniform2f(mouseLocation, mouse.x, mouse.y);
    gl.uniform1f(timeLocation, now * 0.001);
    gl.uniform1f(blindCountLocation, blindCount);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function updateRenderingState() {
    const shouldRender =
      !document.hidden &&
      !hero.classList.contains("is-covered") &&
      !document.body.classList.contains("lanyard-open");
    if (shouldRender === rendering) return;

    rendering = shouldRender;
    cancelAnimationFrame(raf);
    if (!rendering) return;

    lastTime = 0;
    lastFrameTime = 0;
    raf = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    updateRenderingState();
  });
  resizeObserver.observe(canvas);
  new MutationObserver(updateRenderingState).observe(hero, {
    attributes: true,
    attributeFilter: ["class"]
  });
  new MutationObserver(updateRenderingState).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });
  document.addEventListener("visibilitychange", updateRenderingState);
  resize();
  updateRenderingState();
}

initGradientBlinds();

function initHeroCoverState() {
  if (swipeMode) return;

  const hero = document.querySelector(".hero");
  const firstPanel = document.querySelector("main > section:not(.hero)");
  if (!hero || !firstPanel) return;

  let updatePending = false;

  function updateHeroVisibility() {
    updatePending = false;
    const isCovered = firstPanel.getBoundingClientRect().top <= 0;
    hero.classList.toggle("is-covered", isCovered);
    document.body.classList.toggle("is-home", !isCovered);
  }

  function requestUpdate() {
    if (updatePending) return;
    updatePending = true;
    requestAnimationFrame(updateHeroVisibility);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  updateHeroVisibility();
}

initHeroCoverState();

function initLanyardModal() {
  const stage = document.querySelector("#lanyard-stage");
  const canvas = document.querySelector("#lanyard-canvas");
  const contactLink = document.querySelector('.top-nav a[href="#contact"]');
  if (!stage || !canvas || !contactLink) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const points = Array.from({ length: 13 }, () => ({
    x: 0,
    y: 0,
    oldX: 0,
    oldY: 0
  }));
  const card = { x: 0, y: 0, oldX: 0, oldY: 0, width: 230, height: 320, angle: 0 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let segmentLength = 22;
  let dragging = false;
  let running = false;
  let raf = 0;
  let lastTime = 0;
  let cardSpin = 0;
  let quietFrames = 0;
  let lockedScrollX = 0;
  let lockedScrollY = 0;
  let physicsAccumulator = 0;
  const physicsStep = 1 / 60;

  function getAnchorX() {
    const linkRect = contactLink.getBoundingClientRect();
    return Math.max(36, Math.min(width - 36, linkRect.left + linkRect.width * 0.5));
  }

  function resetSimulation() {
    const anchorX = getAnchorX();
    const anchorY = 0;
    segmentLength = Math.max(18, Math.min(26, height * 0.028));

    points.forEach((point, index) => {
      point.x = anchorX - index * segmentLength;
      point.y = anchorY + Math.sin(index * 0.48) * 3;
      point.oldX = point.x;
      point.oldY = point.y;
    });

    const end = points[points.length - 1];
    card.width = Math.max(210, Math.min(286, width * 0.27));
    card.height = card.width * 1.47;
    card.x = end.x - 8;
    card.y = end.y + card.height * 0.08 - 11;
    card.oldX = card.x;
    card.oldY = card.y;
    card.angle = -0.3;
    cardSpin = -0.12;
  }

  function resizeLanyard() {
    const rect = canvas.getBoundingClientRect();
    const nextDpr = Math.min(window.devicePixelRatio || 1, 1.35);
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (width === nextWidth && height === nextHeight && dpr === nextDpr) return false;

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    resetSimulation();
    return true;
  }

  function constrain(a, b, distance, aFixed = false) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const current = Math.max(0.001, Math.hypot(dx, dy));
    const correction = (current - distance) / current;
    const offsetX = dx * correction;
    const offsetY = dy * correction;

    if (aFixed) {
      b.x -= offsetX;
      b.y -= offsetY;
    } else {
      a.x += offsetX * 0.5;
      a.y += offsetY * 0.5;
      b.x -= offsetX * 0.5;
      b.y -= offsetY * 0.5;
    }
  }

  function constrainCardToRope(end) {
    const attachmentY = card.y - card.height * 0.08 + 14;
    const dx = card.x - end.x;
    const dy = attachmentY - end.y;
    const current = Math.max(0.001, Math.hypot(dx, dy));
    const correction = (current - 3) / current;
    const offsetX = dx * correction;
    const offsetY = dy * correction;

    if (dragging) {
      end.x += offsetX;
      end.y += offsetY;
    } else {
      end.x += offsetX * 0.42;
      end.y += offsetY * 0.42;
      card.x -= offsetX * 0.58;
      card.y -= offsetY * 0.58;
    }
  }

  function simulate(step) {
    const gravity = 980 * step * step;
    const linearDamping = Math.exp(-2 * step);

    points.forEach((point, index) => {
      if (index === 0) return;
      const velocityX = (point.x - point.oldX) * linearDamping;
      const velocityY = (point.y - point.oldY) * linearDamping;
      point.oldX = point.x;
      point.oldY = point.y;
      point.x += velocityX;
      point.y += velocityY + gravity;
    });

    if (!dragging) {
      const velocityX = (card.x - card.oldX) * linearDamping;
      const velocityY = (card.y - card.oldY) * linearDamping;
      card.oldX = card.x;
      card.oldY = card.y;
      card.x += velocityX;
      card.y += velocityY + gravity;
    }

    for (let iteration = 0; iteration < 6; iteration += 1) {
      points[0].x = getAnchorX();
      points[0].y = 0;
      for (let index = 0; index < points.length - 1; index += 1) {
        constrain(points[index], points[index + 1], segmentLength, index === 0);
      }

      const end = points[points.length - 1];
      constrainCardToRope(end);
      card.x = Math.max(card.width * 0.5, Math.min(width - card.width * 0.5, card.x));
      card.y = Math.max(card.height * 0.26, Math.min(height - card.height * 0.92 - 24, card.y));
    }

    const previous = points[points.length - 2];
    const end = points[points.length - 1];
    const ropeAngle = Math.atan2(end.y - previous.y, end.x - previous.x) - Math.PI / 2;
    if (!dragging) {
      const angularAcceleration = -Math.sin(card.angle) * 6.5 - cardSpin * 2;
      cardSpin += angularAcceleration * step;
      card.angle += cardSpin * step;
      card.angle += (ropeAngle - card.angle) * 0.012;
    } else {
      cardSpin = 0;
    }
  }

  function roundedRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawCard() {
    context.save();
    context.translate(card.x, card.y);
    context.rotate(card.angle * 0.72);

    const x = -card.width * 0.5;
    const y = -card.height * 0.08;
    const gradient = context.createLinearGradient(x, y, x + card.width, y + card.height);
    gradient.addColorStop(0, "#151515");
    gradient.addColorStop(0.55, "#050505");
    gradient.addColorStop(1, "#111");

    context.shadowColor = "rgba(0,0,0,0.55)";
    context.shadowBlur = 34;
    context.shadowOffsetY = 18;
    roundedRect(context, x, y, card.width, card.height, 7);
    context.fillStyle = gradient;
    context.fill();
    context.shadowColor = "transparent";
    context.strokeStyle = "rgba(255,255,255,0.2)";
    context.lineWidth = 1;
    context.stroke();

    context.save();
    context.strokeStyle = "rgba(255,255,255,0.08)";
    context.lineWidth = 1;
    const gridSize = Math.max(8, card.width * 0.035);
    for (let gx = x + gridSize; gx < x + card.width; gx += gridSize) {
      context.beginPath();
      context.moveTo(gx, y);
      context.lineTo(gx, y + card.height);
      context.stroke();
    }
    for (let gy = y + gridSize; gy < y + card.height; gy += gridSize) {
      context.beginPath();
      context.moveTo(x, gy);
      context.lineTo(x + card.width, gy);
      context.stroke();
    }
    context.restore();

    const pad = card.width * 0.075;
    context.fillStyle = "#fff";
    context.font = `800 ${Math.round(card.width * 0.14)}px Arial, sans-serif`;
    context.fillText("李吴鹏", x + pad, y + card.height * 0.17);

    context.fillStyle = "rgba(255,255,255,0.95)";
    context.font = `700 ${Math.round(card.width * 0.052)}px Arial, sans-serif`;
    context.fillText("UX/UI DESIGNER", x + pad, y + card.height * 0.235);
    context.fillText("& PRODUCT BUILDER", x + pad, y + card.height * 0.272);

    const portraitX = x + card.width * 0.47;
    const portraitY = y + card.height * 0.29;
    const portraitW = card.width * 0.45;
    const portraitH = card.height * 0.37;
    context.fillStyle = "#e8e8e8";
    context.fillRect(portraitX, portraitY, portraitW, portraitH);
    context.fillStyle = "#161616";
    context.beginPath();
    context.arc(portraitX + portraitW * 0.5, portraitY + portraitH * 0.32, portraitW * 0.2, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(
      portraitX + portraitW * 0.5,
      portraitY + portraitH * 0.87,
      portraitW * 0.34,
      portraitH * 0.38,
      0,
      0,
      Math.PI * 2
    );
    context.fill();

    context.fillStyle = "#fff";
    context.font = `700 ${Math.round(card.width * 0.045)}px Arial, sans-serif`;
    context.fillText("李吴鹏", x + pad, y + card.height * 0.38);
    context.fillStyle = "rgba(255,255,255,0.62)";
    context.font = `400 ${Math.round(card.width * 0.03)}px Arial, sans-serif`;
    ["UI DESIGN", "UX RESEARCH", "DESIGN SYSTEM", "PROTOTYPE"].forEach((line, index) => {
      context.fillText(line, x + pad, y + card.height * (0.43 + index * 0.038));
    });

    context.fillStyle = "#fff";
    context.font = `700 ${Math.round(card.width * 0.052)}px Arial, sans-serif`;
    context.fillText("AIG CREATOR", x + pad, y + card.height * 0.72);
    context.fillText("& AI BUILDER", x + pad, y + card.height * 0.76);

    context.fillStyle = "rgba(255,255,255,0.9)";
    context.font = `700 ${Math.round(card.width * 0.045)}px Arial, sans-serif`;
    context.fillText("135 9387 4603", x + pad, y + card.height * 0.88);
    context.fillStyle = "rgba(255,255,255,0.66)";
    context.font = `400 ${Math.round(card.width * 0.03)}px Arial, sans-serif`;
    context.fillText("WUHAN · CHINA · 2026", x + pad, y + card.height * 0.92);

    context.fillStyle = "#fff";
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if ((row + col) % 3 === 0) continue;
        const size = card.width * 0.025;
        context.fillRect(
          x + card.width - pad - col * size * 1.5,
          y + card.height * 0.7 + row * size * 1.45,
          size,
          size
        );
      }
    }

    const claspY = y - 26;
    const claspGradient = context.createLinearGradient(-18, claspY, 18, claspY + 44);
    claspGradient.addColorStop(0, "#d9dde2");
    claspGradient.addColorStop(0.3, "#717985");
    claspGradient.addColorStop(0.62, "#252a31");
    claspGradient.addColorStop(1, "#aeb4bc");
    roundedRect(context, -18, claspY, 36, 42, 8);
    context.fillStyle = claspGradient;
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.72)";
    context.lineWidth = 1.5;
    context.stroke();

    roundedRect(context, -10, claspY + 7, 20, 26, 5);
    context.fillStyle = "#090a0d";
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.22)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "#17171b";
    context.strokeStyle = "#969da7";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(0, y + 14, 9, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(255,255,255,0.6)";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(-2, y + 12, 5, Math.PI * 1.05, Math.PI * 1.75);
    context.stroke();

    context.restore();
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    const bandWidth = Math.max(18, width * 0.023);
    context.strokeStyle = "#050505";
    context.lineWidth = bandWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const point = points[index];
      const next = points[index + 1];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) * 0.5, (point.y + next.y) * 0.5);
    }
    context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    context.stroke();

    context.save();
    context.setLineDash([1.2, 2.6]);
    context.strokeStyle = "rgba(255,255,255,0.16)";
    context.lineWidth = Math.max(1, bandWidth * 0.08);
    for (let offset = -bandWidth * 0.36; offset <= bandWidth * 0.36; offset += bandWidth * 0.12) {
      context.beginPath();
      context.moveTo(points[0].x + offset, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        const point = points[index];
        context.lineTo(point.x + offset, point.y);
      }
      context.stroke();
    }
    context.setLineDash([]);
    context.strokeStyle = "rgba(255,255,255,0.2)";
    context.lineWidth = Math.max(1, bandWidth * 0.06);
    context.beginPath();
    context.moveTo(points[0].x - bandWidth * 0.44, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x - bandWidth * 0.44, points[index].y);
    }
    context.stroke();
    context.strokeStyle = "rgba(0,0,0,0.72)";
    context.beginPath();
    context.moveTo(points[0].x + bandWidth * 0.44, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x + bandWidth * 0.44, points[index].y);
    }
    context.stroke();
    context.restore();

    drawCard();
  }

  function frame(now) {
    if (!running) return;
    raf = 0;
    resizeLanyard();
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : physicsStep;
    lastTime = now;
    if (dragging || quietFrames < 18) {
      physicsAccumulator = Math.min(physicsAccumulator + delta, physicsStep * 4);
      while (physicsAccumulator >= physicsStep) {
        simulate(physicsStep);
        physicsAccumulator -= physicsStep;
      }
      if (!dragging) {
        const cardSpeed = Math.hypot(card.x - card.oldX, card.y - card.oldY);
        const end = points[points.length - 1];
        const ropeSpeed = Math.hypot(end.x - end.oldX, end.y - end.oldY);
        quietFrames = cardSpeed + ropeSpeed + Math.abs(cardSpin) < 0.6 ? quietFrames + 1 : 0;
      }
    } else {
      points.forEach((point) => {
        point.oldX = point.x;
        point.oldY = point.y;
      });
      card.oldX = card.x;
      card.oldY = card.y;
    }
    draw();
    if (dragging || quietFrames < 18) {
      raf = requestAnimationFrame(frame);
    }
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function isOverCard(position) {
    return (
      Math.abs(position.x - card.x) <= card.width * 0.65 &&
      position.y >= card.y - card.height * 0.15 &&
      position.y <= card.y + card.height
    );
  }

  canvas.addEventListener("pointerdown", (event) => {
    const position = pointerPosition(event);
    if (!isOverCard(position)) return;
    dragging = true;
    quietFrames = 0;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
    card.oldX = card.x;
    card.oldY = card.y;
    cardSpin = 0;
    if (!raf) {
      lastTime = 0;
      raf = requestAnimationFrame(frame);
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const position = pointerPosition(event);
    card.oldX = card.x;
    card.oldY = card.y;
    card.x = position.x;
    card.y = position.y - card.height * 0.42;
  });

  function releasePointer(event) {
    if (!dragging) return;
    dragging = false;
    quietFrames = 0;
    canvas.classList.remove("is-dragging");
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);

  function openStage(event) {
    event.preventDefault();
    if (stage.classList.contains("is-open")) {
      closeStage();
      return;
    }

    lockedScrollX = window.scrollX;
    lockedScrollY = window.scrollY;
    document.body.classList.add("lanyard-open");
    stage.classList.add("is-open");
    stage.setAttribute("aria-hidden", "false");
    contactLink.classList.add("is-active");
    contactLink.setAttribute("aria-expanded", "true");
    contactLink.setAttribute("aria-label", "收起");
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    running = true;
    lastTime = 0;
    quietFrames = 0;
    physicsAccumulator = 0;
    const resized = resizeLanyard();
    if (!resized) resetSimulation();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function closeStage() {
    stage.classList.remove("is-open");
    stage.setAttribute("aria-hidden", "true");
    contactLink.classList.remove("is-active");
    contactLink.setAttribute("aria-expanded", "false");
    contactLink.setAttribute("aria-label", "联系我");
    running = false;
    dragging = false;
    physicsAccumulator = 0;
    cancelAnimationFrame(raf);
    document.body.classList.remove("lanyard-open");
    window.scrollTo(lockedScrollX, lockedScrollY);
    contactLink.focus();
  }

  contactLink.addEventListener("click", openStage);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && stage.classList.contains("is-open")) closeStage();
  });
  window.addEventListener("resize", () => {
    resizeLanyard();
    if (running && !raf) {
      lastTime = 0;
      quietFrames = 0;
      raf = requestAnimationFrame(frame);
    }
  }, { passive: true });

  const prewarm = () => {
    resizeLanyard();
    draw();
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(prewarm, { timeout: 800 });
  } else {
    window.setTimeout(prewarm, 120);
  }
}

initLanyardModal();

if (!swipeMode) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { threshold: 0.42 }
  );

  sections.forEach((section) => observer.observe(section));
}

const bounceCards = document.querySelector(".bounce-cards");
if (bounceCards) {
  const cards = [...bounceCards.querySelectorAll(".bounce-card")];
  const baseTransforms = [
    "translateX(-50%) rotate(5deg) translateX(-220px)",
    "translateX(-50%) rotate(0deg) translateX(-105px)",
    "translateX(-50%) rotate(-5deg) translateX(0px)",
    "translateX(-50%) rotate(5deg) translateX(105px)",
    "translateX(-50%) rotate(-5deg) translateX(220px)"
  ];
  const cardAnimations = new Map();
  let settleTimer = 0;

  function getNoRotationTransform(transform) {
    return transform.replace(/rotate\([^)]*\)/, "rotate(0deg)");
  }

  function getPushedTransform(transform, offsetX) {
    const matches = [...transform.matchAll(/translateX\(([-0-9.]+)px\)/g)];
    const match = matches[matches.length - 1];
    if (!match) return `${transform} translateX(${offsetX}px)`;

    const currentX = Number.parseFloat(match[1]);
    return `${transform.slice(0, match.index)}translateX(${currentX + offsetX}px)${transform.slice(match.index + match[0].length)}`;
  }

  function animateCard(card, transform, delay = 0) {
    const currentTransform = getComputedStyle(card).transform;
    const previousAnimation = cardAnimations.get(card);
    if (previousAnimation) previousAnimation.cancel();

    const animation = card.animate(
      [{ transform: currentTransform }, { transform }],
      {
        duration: 400,
        delay,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        fill: "forwards"
      }
    );
    cardAnimations.set(card, animation);
  }

  function pushSiblings(hoveredIndex) {
    cards.forEach((card, index) => {
      card.classList.toggle("is-hovered", index === hoveredIndex);

      if (index === hoveredIndex) {
        animateCard(card, getNoRotationTransform(baseTransforms[index]));
        return;
      }

      const offsetX = index < hoveredIndex ? -325 : 325;
      const delay = Math.abs(hoveredIndex - index) * 50;
      animateCard(card, getPushedTransform(baseTransforms[index], offsetX), delay);
    });
  }

  function resetSiblings() {
    cards.forEach((card, index) => {
      card.classList.remove("is-hovered");
      animateCard(card, baseTransforms[index]);
    });
  }

  function resetEntrance() {
    window.clearTimeout(settleTimer);
    bounceCards.classList.remove("is-visible", "is-settled");
    cards.forEach((card) => {
      card.classList.remove("is-hovered");
      cardAnimations.get(card)?.cancel();
      cardAnimations.delete(card);
    });
  }

  function playEntrance() {
    resetEntrance();
    void bounceCards.offsetWidth;
    window.requestAnimationFrame(() => {
      bounceCards.classList.add("is-visible");
      settleTimer = window.setTimeout(() => bounceCards.classList.add("is-settled"), 2100);
    });
  }

  bounceCards.addEventListener("resetcards", resetSiblings);
  bounceCards.addEventListener("playcards", playEntrance);
  bounceCards.addEventListener("hidecards", resetEntrance);

  if (!swipeMode) {
    const bounceCardsObserver = new IntersectionObserver(
      ([entry]) => {
        bounceCards.dispatchEvent(new Event(entry.isIntersecting ? "playcards" : "hidecards"));
      },
      { threshold: 0.35 }
    );
    bounceCardsObserver.observe(bounceCards);
  }

  cards.forEach((card, index) => {
    card.addEventListener("mouseenter", () => pushSiblings(index));
    card.addEventListener("mouseleave", resetSiblings);
  });
}

function initProjectModal() {
  const modal = document.querySelector("#project-modal");
  const panel = modal?.querySelector(".project-modal-panel");
  const modalMedia = modal?.querySelector(".project-modal-media");
  const modalTitle = modal?.querySelector("#project-modal-title");
  const closeButton = modal?.querySelector(".project-modal-close");
  const cards = [...document.querySelectorAll(".bounce-card, .project-tile")];
  if (!modal || !panel || !modalMedia || !modalTitle || !closeButton || !cards.length) return;

  let previousFocus = null;
  const projectGalleries = {
    "meishang-app": {
      title: "美上云端 App",
      images: [
        { src: "assets/projects/meishang-app/1.png", width: 1920, height: 3354 },
        { src: "assets/projects/meishang-app/2.png", width: 1920, height: 16641 },
        { src: "assets/projects/meishang-app/3.png", width: 1920, height: 2604 },
        { src: "assets/projects/meishang-app/4.png", width: 1920, height: 2351 },
        { src: "assets/projects/meishang-app/5.png", width: 1920, height: 1392 },
      ],
    },
    "audience-saas": {
      title: "人群经营 SaaS",
      images: [
        { src: "assets/projects/audience-saas/1.png", width: 1920, height: 4192 },
        { src: "assets/projects/audience-saas/2.png", width: 1920, height: 978 },
        { src: "assets/projects/audience-saas/3.png", width: 1920, height: 3994 },
        { src: "assets/projects/audience-saas/4.png", width: 1920, height: 1190 },
      ],
    },
    "slsg-miniapp": {
      title: "圣莉斯歌小程序",
      images: [
        { src: "assets/projects/slsg-miniapp/1.png", width: 1920, height: 1024 },
        { src: "assets/projects/slsg-miniapp/2.png", width: 1920, height: 1581 },
        { src: "assets/projects/slsg-miniapp/3.png", width: 1920, height: 3635 },
        { src: "assets/projects/slsg-miniapp/4.png", width: 1920, height: 2044 },
        { src: "assets/projects/slsg-miniapp/5.png", width: 1920, height: 1250 },
        { src: "assets/projects/slsg-miniapp/6.png", width: 1920, height: 1240 },
        { src: "assets/projects/slsg-miniapp/7.png", width: 1920, height: 1240 },
        { src: "assets/projects/slsg-miniapp/8.png", width: 1920, height: 1240 },
        { src: "assets/projects/slsg-miniapp/9.png", width: 1920, height: 980 },
        { src: "assets/projects/slsg-miniapp/10.png", width: 1920, height: 1200 },
      ],
    },
    "lingxiaoxi-ip": {
      title: "灵小犀 IP 形象",
      images: [
        { src: "assets/projects/lingxiaoxi-ip/1.png", width: 1920, height: 1110 },
        { src: "assets/projects/lingxiaoxi-ip/2.png", width: 1920, height: 5587 },
      ],
    },
  };

  function renderSingleImage(image) {
    modalMedia.className = "project-modal-media project-modal-media--single";
    modalMedia.replaceChildren(
      Object.assign(document.createElement("img"), {
        src: image.currentSrc || image.src,
        alt: image.alt,
        width: 1920,
        height: 1080,
      })
    );
  }

  function renderGallery(project) {
    modalMedia.className = "project-modal-media project-modal-media--gallery";
    modalMedia.replaceChildren(
      ...project.images.map(({ src, width, height }, index) =>
        Object.assign(document.createElement("img"), {
          src,
          alt: `${project.title} 项目详情第 ${index + 1} 部分`,
          width,
          height,
          loading: index === 0 ? "eager" : "lazy",
          decoding: "async",
        })
      )
    );
  }

  function openModal(card) {
    const image = card.querySelector("img");
    if (!image) return;

    previousFocus = document.activeElement;
    const project = projectGalleries[card.dataset.project];
    if (project) {
      renderGallery(project);
      modalTitle.textContent = project.title;
    } else {
      renderSingleImage(image);
      modalTitle.textContent = image.alt.replace(/设计项目|项目视觉|形象设计项目/g, "");
    }
    modalMedia.scrollTop = 0;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("project-modal-open");
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("project-modal-open");
    window.setTimeout(() => {
      modalMedia.replaceChildren();
      previousFocus?.focus?.();
    }, 320);
  }

  cards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.addEventListener("click", () => openModal(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(card);
      }
    });
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  panel.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}

initProjectModal();

function initServiceGallery() {
  const gallery = document.querySelector(".service-gallery");
  const section = gallery?.closest(".services");
  const columns = [...gallery?.querySelectorAll(".service-column") || []];
  if (!gallery || !section || !columns.length) return;

  if (!window.gsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const setters = columns.map((column) => ({
    speed: Number.parseFloat(column.dataset.speed || "0"),
    setY: gsap.quickSetter(column, "y", "px")
  }));

  let frame = 0;
  function updateColumns() {
    frame = 0;
    const progress = document.body.classList.contains("gsap-swipe-enabled")
      ? section.scrollTop
      : Math.max(0, -gallery.getBoundingClientRect().top + window.innerHeight * 0.15);
    setters.forEach(({ speed, setY }) => setY(progress * speed));
  }

  const scrollTarget = document.body.classList.contains("gsap-swipe-enabled")
    ? section
    : window;

  scrollTarget.addEventListener("scroll", () => {
    if (!frame) frame = window.requestAnimationFrame(updateColumns);
  }, { passive: true });

  updateColumns();
}

initServiceGallery();

function initTextType() {
  document.querySelectorAll("[data-type-text]").forEach((element) => {
    const content = element.querySelector(".text-type-content");
    const text = element.dataset.typeText || "";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!content) return;

    if (reducedMotion) {
      content.textContent = text;
      return;
    }

    let characterIndex = 0;
    let timeout = 0;
    let running = false;

    function schedule(delay) {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(step, delay);
    }

    function step() {
      if (!running) return;

      characterIndex += 1;
      content.textContent = text.slice(0, characterIndex);
      if (characterIndex < text.length) {
        schedule(120);
      } else {
        running = false;
        element.classList.add("is-typing-complete");
      }
    }

    function start() {
      if (running) return;
      running = true;
      schedule(characterIndex ? 120 : 300);
    }

    function stop() {
      running = false;
      window.clearTimeout(timeout);
      characterIndex = 0;
      content.textContent = "";
      element.classList.remove("is-typing-complete");
    }

    element.addEventListener("playtype", start);
    element.addEventListener("hidetype", stop);

    const mission = element.closest(".mission");
    if (!mission) return;

    new MutationObserver(() => {
      if (mission.classList.contains("is-active") || !mission.classList.contains("swipe-panel")) {
        start();
      } else {
        stop();
      }
    }).observe(mission, { attributes: true, attributeFilter: ["class"] });

    if (mission.classList.contains("is-active") || !swipeMode) start();
  });
}

initTextType();

function getRevealElements(panel) {
  if (panel.classList.contains("hero") || panel.matches("#mission")) return [];

  const selectors = panel.matches("#news")
    ? [".flowing-menu-label", ".flowing-menu-item"]
    : panel.matches("#works")
      ? [".resume-header", ".resume-block"]
      : panel.matches("#services")
        ? [".service-gallery"]
        : [":scope > *"];

  return selectors.flatMap((selector) => [...panel.querySelectorAll(selector)]);
}

function initScrollReveal() {
  if (swipeMode) return;

  const revealElements = [...document.querySelectorAll("main > section")]
    .flatMap(getRevealElements);

  revealElements.forEach((element, index) => {
    element.classList.add("scroll-reveal");
    element.style.setProperty("--reveal-delay", `${(index % 5) * 70}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  revealElements.forEach((element) => observer.observe(element));
}

initScrollReveal();

function initSwipeSections() {
  if (!swipeMode) return;

  gsap.registerPlugin(Observer);

  const panels = [...document.querySelectorAll("main > section, body > footer")];
  const hero = document.querySelector(".hero");
  const panelByHash = new Map(
    panels.flatMap((panel, index) => {
      if (panel.classList.contains("hero")) return [["#top", index]];
      return panel.id ? [[`#${panel.id}`, index]] : [];
    })
  );
  const initialIndex = panelByHash.get(location.hash) ?? 0;
  let currentIndex = initialIndex;
  let animating = false;

  panels.forEach((panel, index) => {
    panel.classList.add("swipe-panel");
    panel.setAttribute("aria-hidden", index === initialIndex ? "false" : "true");
    panel.inert = index !== initialIndex;
  });

  function panelContent(panel) {
    return getRevealElements(panel);
  }

  function updateActiveState(index, playMissionContent = true) {
    const activePanel = panels[index];
    document.body.classList.toggle("is-home", activePanel === hero);
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", active ? "false" : "true");
      panel.inert = !active;
    });

    navLinks.forEach((link) => {
      const hash = link.getAttribute("href");
      link.classList.toggle("is-active", hash === `#${activePanel.id}`);
    });

    if (hero) {
      hero.classList.toggle("is-covered", activePanel !== hero);
    }

    const missionCards = document.querySelector("#mission .bounce-cards");
    const missionTitle = document.querySelector("#mission .mission-title");
    if (activePanel.matches("#mission")) {
      if (missionCards) gsap.set(missionCards, { clearProps: "transform,translate,opacity,visibility" });
      if (playMissionContent) {
        missionCards?.dispatchEvent(new Event("playcards"));
        missionTitle?.dispatchEvent(new Event("playtype"));
      }
    } else {
      missionCards?.dispatchEvent(new Event("hidecards"));
      missionTitle?.dispatchEvent(new Event("hidetype"));
    }
  }

  gsap.set(panels, {
    autoAlpha: 0,
    yPercent: 100,
    zIndex: 1
  });
  gsap.set(panels[initialIndex], {
    autoAlpha: 1,
    yPercent: 0,
    zIndex: 2
  });
  const initialContent = panelContent(panels[initialIndex]);
  if (initialContent.length) {
    gsap.fromTo(
      initialContent,
      { autoAlpha: 0, y: 46, filter: "blur(14px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.82,
        stagger: 0.07,
        ease: "power3.out"
      }
    );
  }
  gsap.set(".hero-title-art", { clearProps: "transform,opacity,visibility" });
  updateActiveState(initialIndex);

  function goToPanel(requestedIndex, direction = 1) {
    if (animating) return;

    const nextIndex = Math.max(0, Math.min(panels.length - 1, requestedIndex));
    if (nextIndex === currentIndex) return;

    animating = true;
    const currentPanel = panels[currentIndex];
    const nextPanel = panels[nextIndex];
    const movement = direction > 0 ? 1 : -1;
    const nextContent = panelContent(nextPanel);

    nextPanel.scrollTop = 0;
    if (nextPanel.classList.contains("hero")) {
      gsap.set(".hero-title-art", { clearProps: "transform,opacity,visibility" });
    }
    nextPanel.inert = false;
    nextPanel.setAttribute("aria-hidden", "false");

    gsap.set(nextPanel, {
      autoAlpha: 1,
      yPercent: movement * 100,
      zIndex: 3
    });
    if (nextContent.length) {
      gsap.set(nextContent, {
        autoAlpha: 0,
        y: movement * 56,
        filter: "blur(14px)"
      });
    }

    const transition = gsap.timeline({
      defaults: { duration: 1.05, ease: "power4.inOut" },
      onComplete: () => {
        currentIndex = nextIndex;
        animating = false;
        gsap.set(currentPanel, { autoAlpha: 0, zIndex: 1 });
        updateActiveState(currentIndex, !nextPanel.matches("#mission"));

        const hash = nextPanel.classList.contains("hero")
          ? "#top"
          : nextPanel.id
            ? `#${nextPanel.id}`
            : "";
        if (hash) history.replaceState(null, "", hash);
      }
    });

    transition
      .to(currentPanel, {
        yPercent: movement * -100,
        autoAlpha: 0
      }, 0)
      .to(nextPanel, {
        yPercent: 0
      }, 0);

    if (nextPanel.matches("#mission")) {
      transition.call(() => {
        const missionTitle = nextPanel.querySelector(".mission-title");
        missionTitle?.dispatchEvent(new Event("playtype"));
      }, null, 0.45);

      transition.call(() => {
        const missionCards = nextPanel.querySelector(".bounce-cards");
        if (missionCards) {
          gsap.set(missionCards, { clearProps: "transform,translate,opacity,visibility" });
          missionCards.dispatchEvent(new Event("playcards"));
        }
      }, null, 0.75);
    }

    if (nextContent.length) {
      transition.to(nextContent, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.78,
        stagger: 0.07,
        ease: "power3.out"
      }, 0.33);
    }
  }

  function canScrollActivePanel(direction) {
    const activePanel = panels[currentIndex];
    const overflowY = getComputedStyle(activePanel).overflowY;
    if (overflowY !== "auto" && overflowY !== "scroll") return false;

    const maxScroll = activePanel.scrollHeight - activePanel.clientHeight;
    if (maxScroll <= 2) return false;

    return direction > 0
      ? activePanel.scrollTop < maxScroll - 2
      : activePanel.scrollTop > 2;
  }

  function requestPanel(direction) {
    if (
      document.body.classList.contains("lanyard-open") ||
      document.body.classList.contains("project-modal-open")
    ) return;
    if (animating || canScrollActivePanel(direction)) return;
    goToPanel(currentIndex + direction, direction);
  }

  Observer.create({
    target: window,
    type: "wheel,touch,pointer",
    preventDefault: false,
    wheelSpeed: -1,
    tolerance: 12,
    onDown: () => requestPanel(-1),
    onUp: () => requestPanel(1)
  });

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    if (document.body.classList.contains("lanyard-open")) return;
    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      goToPanel(currentIndex + 1, 1);
    } else if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      goToPanel(currentIndex - 1, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToPanel(0, -1);
    } else if (event.key === "End") {
      event.preventDefault();
      goToPanel(panels.length - 1, 1);
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#contact" || !panelByHash.has(hash)) return;
      event.preventDefault();
      const nextIndex = panelByHash.get(hash);
      goToPanel(nextIndex, nextIndex > currentIndex ? 1 : -1);
    });
  });
}

initSwipeSections();

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  const watchedFiles = ["index.html", "src/styles/main.css", "src/scripts/main.js"];
  let signature = "";

  async function getSignature() {
    const parts = await Promise.all(
      watchedFiles.map(async (file) => {
        const response = await fetch(file, { method: "HEAD", cache: "no-store" });
        return [
          response.headers.get("last-modified"),
          response.headers.get("content-length")
        ].join(":");
      })
    );
    return parts.join("|");
  }

  getSignature().then((value) => {
    signature = value;
    setInterval(async () => {
      try {
        const nextSignature = await getSignature();
        if (signature && nextSignature !== signature) {
          location.reload();
        }
        signature = nextSignature;
      } catch {
        // Preview server may be restarting.
      }
    }, 4000);
  });
}
