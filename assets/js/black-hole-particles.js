(function () {
  "use strict";

  var canvas = document.querySelector("[data-black-hole-particles]");
  if (!canvas || !canvas.getContext) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  var scene = canvas.parentElement;
  // A canvas in normal flow can grow its own ResizeObserver parent when an older
  // stylesheet is cached. Keep its intrinsic size out of layout.
  scene.style.position = "relative";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var points = [];
  var width = 0;
  var height = 0;
  var frameId = 0;
  var lastFrame = 0;
  var visible = !window.IntersectionObserver;
  var baseYaw = .2;
  var basePitch = .2;
  var yaw = baseYaw;
  var pitch = basePitch;
  var targetYaw = baseYaw;
  var targetPitch = basePitch;
  var offsetX = 0;
  var offsetY = 0;
  var targetX = 0;
  var targetY = 0;
  var pointerX = 0;
  var pointerY = 0;
  var targetPointerX = 0;
  var targetPointerY = 0;
  var hover = 0;
  var targetHover = 0;

  function createPoints() {
    var seed = 271828;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    }
    function add(radius, angle, y, face, opacity, size, speed) {
      points.push({ radius: radius, angle: angle, y: y, face: face, opacity: opacity, size: size || .65 + random() * 1.25, speed: speed || 0, phase: random() * Math.PI * 2 });
    }

    points = [];
    var density = width < 480 ? .55 : 1;
    for (var i = 0; i < 2500 * density; i++) {
      var radius = 51 + Math.pow(random(), 1.45) * 113;
      var angle = random() * Math.PI * 2;
      var tone = random();
      var face = radius < 94 ? "hot" : tone < .72 ? "amber" : tone < .87 ? "blue" : "haze";
      add(radius, angle, (random() - .5) * 4, face, .32 + random() * .6, null, .65 + (164 - radius) / 125);
    }
    for (var i = 0; i < 300 * density; i++) {
      add(50 + (random() - .5) * 7, random() * Math.PI * 2, (random() - .5) * 4, "hot", .65 + random() * .35, .8 + random() * 1.15, 1.6);
    }
    for (var i = 0; i < 180 * density; i++) {
      add(145 + random() * 22, random() * Math.PI * 2, (random() - .5) * 18, "blue", .15 + random() * .3, null, .55);
    }
    // A bright asymmetric knot makes the disk's three-dimensional rotation legible.
    add(129, .7, -2, "flare", .95, 3.5, 1.15);
    for (var i = 0; i < 75 * density; i++) {
      points.push({ x: -225 + random() * 450, y: -165 + random() * 330, z: -120 + random() * 240,
        face: "dust", opacity: .08 + random() * .22, size: .5 + random() * .85, phase: random() * Math.PI * 2 });
    }
  }

  function draw(time) {
    if (!width || !height) return;
    var still = reducedMotion && reducedMotion.matches;
    var light = document.documentElement.getAttribute("data-theme") === "light";
    var colors = light
      ? { hot: "#bb6729", amber: "#a5612f", blue: "#506ca2", haze: "#826a9a", flare: "#c77c2e", dust: "#7b83a9" }
      : { hot: "#ffe0a7", amber: "#ffb376", blue: "#a3bdf6", haze: "#b39bd5", flare: "#fff0cc", dust: "#aab5df" };
    var scale = Math.min(width / 410, height / 350);
    var holeRadius = 34 * scale;
    var rippleRadius = Math.min(72, width * .16);

    context.clearRect(0, 0, width, height);
    if (!still) {
      yaw += (targetYaw + Math.sin(time * .00024) * .035 - yaw) * .07;
      pitch += (targetPitch + Math.sin(time * .00029) * .025 - pitch) * .07;
      offsetX += (targetX - offsetX) * .06;
      offsetY += (targetY - offsetY) * .06;
      pointerX += (targetPointerX - pointerX) * .2;
      pointerY += (targetPointerY - pointerY) * .2;
      hover += (targetHover - hover) * .14;
    }
    var cx = width * .5 + offsetX;
    var cy = height * .49 + offsetY + (still ? 0 : Math.sin(time * .0007) * 4);

    var glow = context.createRadialGradient(cx, cy, holeRadius * .6, cx, cy, 165 * scale);
    glow.addColorStop(0, "rgba(255, 180, 110, 0)");
    glow.addColorStop(.35, light ? "rgba(197, 126, 70, .12)" : "rgba(255, 161, 93, .12)");
    glow.addColorStop(.65, light ? "rgba(91, 124, 184, .045)" : "rgba(123, 152, 218, .055)");
    glow.addColorStop(1, "rgba(100, 120, 190, 0)");
    context.fillStyle = glow;
    context.fillRect(cx - 165 * scale, cy - 165 * scale, 330 * scale, 330 * scale);

    var cosY = Math.cos(yaw);
    var sinY = Math.sin(yaw);
    var cosP = Math.cos(pitch);
    var sinP = Math.sin(pitch);
    var projected = points.map(function (point) {
      var angle = point.angle + (still || point.face === "dust" ? 0 : time * .00014 * point.speed);
      var px = point.face === "dust" ? point.x : Math.cos(angle) * point.radius;
      var pz = point.face === "dust" ? point.z : Math.sin(angle) * point.radius;
      var py = point.y + (point.face === "dust" ? 0 : Math.sin(angle * 2 + point.radius * .03) * 2);
      var x = px * cosY + pz * sinY;
      var z = pz * cosY - px * sinY;
      var y = py * cosP + z * sinP;
      var depth = z * cosP - py * sinP;
      var perspective = 690 / (690 - depth);
      return { x: cx + x * perspective * scale, y: cy + y * perspective * scale, depth: depth,
        size: point.size * perspective * scale, point: point };
    });
    projected.sort(function (a, b) { return a.depth - b.depth; });

    function lensPath(upper) {
      context.beginPath();
      if (upper) {
        context.moveTo(cx - holeRadius * 3.1, cy);
        context.bezierCurveTo(cx - holeRadius * 1.65, cy - holeRadius * .12,
          cx - holeRadius * 1.55, cy - holeRadius * 1.86, cx, cy - holeRadius * 1.86);
        context.bezierCurveTo(cx + holeRadius * 1.55, cy - holeRadius * 1.86,
          cx + holeRadius * 1.65, cy - holeRadius * .12, cx + holeRadius * 3.1, cy);
      } else {
        context.moveTo(cx - holeRadius * 1.25, cy + holeRadius * .28);
        context.bezierCurveTo(cx - holeRadius * 1.45, cy + holeRadius * 2.3,
          cx + holeRadius * 1.45, cy + holeRadius * 2.3, cx + holeRadius * 1.25, cy + holeRadius * .28);
      }
    }

    function paintLens(upper) {
      context.save();
      context.strokeStyle = light ? "#ad7443" : "#ffd6a0";
      context.shadowColor = light ? "#ba8c5a" : "#ffc38c";
      for (var layer = 0; layer < 3; layer++) {
        context.lineWidth = (upper ? 17 : 13) * scale / (layer + 1);
        context.globalAlpha = (upper ? .12 : .08) + layer * (upper ? .19 : .12);
        context.shadowBlur = layer === 0 ? 22 : 10;
        lensPath(upper);
        context.stroke();
      }
      context.restore();
    }

    function dot(item) {
      var point = item.point;
      if (Math.hypot(item.x - cx, item.y - cy) < holeRadius + 2) return;
      var drift = still ? 0 : Math.sin(time * .0008 + point.phase) * (point.face === "dust" ? 2 : .45);
      var x = item.x + drift;
      var y = item.y + drift * .6;
      var shimmer = still ? 1 : .84 + .16 * Math.sin(time * .002 + point.phase);
      var opacity = point.opacity * shimmer * (item.depth < 0 ? .55 : 1);
      if (!still && hover > .002 && point.face !== "dust") {
        var dx = x - pointerX;
        var dy = y - pointerY;
        var distance = Math.hypot(dx, dy);
        if (distance < rippleRadius * 1.5) {
          var push = rippleRadius * .38 * hover * Math.exp(-distance * distance / (rippleRadius * rippleRadius * .45));
          if (distance > .01) {
            x += dx / distance * push;
            y += dy / distance * push;
          }
          opacity *= 1 - .7 * hover * Math.exp(-distance * distance / (rippleRadius * rippleRadius * .22));
        }
      }
      context.globalAlpha = Math.min(1, opacity);
      context.fillStyle = colors[point.face];
      context.beginPath();
      context.arc(x, y, item.size, 0, Math.PI * 2);
      context.fill();
    }

    projected.forEach(function (item) { if (item.depth < 0) dot(item); });

    // The thin disk crosses the center; its far side is lensed above the shadow.
    var streak = context.createLinearGradient(cx - 165 * scale, cy, cx + 165 * scale, cy);
    streak.addColorStop(0, "rgba(255, 185, 112, 0)");
    streak.addColorStop(.2, light ? "rgba(169, 104, 46, .35)" : "rgba(255, 197, 128, .48)");
    streak.addColorStop(.5, light ? "rgba(181, 116, 58, .6)" : "rgba(255, 225, 178, .8)");
    streak.addColorStop(.8, light ? "rgba(169, 104, 46, .35)" : "rgba(255, 197, 128, .48)");
    streak.addColorStop(1, "rgba(255, 185, 112, 0)");
    context.save();
    context.strokeStyle = streak;
    context.shadowColor = light ? "#c79367" : "#ffd1a2";
    context.shadowBlur = 12;
    context.lineWidth = 2.1 * scale;
    context.globalAlpha = .8;
    context.beginPath();
    context.moveTo(cx - 165 * scale, cy);
    context.lineTo(cx + 165 * scale, cy);
    context.stroke();
    context.restore();
    paintLens(true);

    context.save();
    context.globalAlpha = 1;
    context.shadowColor = light ? "#b39a84" : "#b79575";
    context.shadowBlur = 8;
    var horizon = context.createRadialGradient(cx, cy, 0, cx, cy, holeRadius * 1.12);
    horizon.addColorStop(0, light ? "#26354d" : "#080f1d");
    horizon.addColorStop(.7, light ? "#2c3d53" : "#0b1425");
    horizon.addColorStop(1, light ? "#374b63" : "#14243a");
    context.fillStyle = horizon;
    context.beginPath();
    context.arc(cx, cy, holeRadius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    projected.forEach(function (item) { if (item.depth >= 0) dot(item); });

    paintLens(false);
    // Keep the near-side disk narrow instead of drawing a full Saturn-like ring.
    context.save();
    context.strokeStyle = light ? "rgba(160, 99, 49, .45)" : "rgba(255, 216, 165, .58)";
    context.lineWidth = 1.1 * scale;
    context.beginPath();
    context.moveTo(cx - 165 * scale, cy + 2 * scale);
    context.lineTo(cx - holeRadius - 4 * scale, cy + 2 * scale);
    context.moveTo(cx + holeRadius + 4 * scale, cy + 2 * scale);
    context.lineTo(cx + 165 * scale, cy + 2 * scale);
    context.stroke();
    context.restore();

    if (!still && hover > .01) {
      context.strokeStyle = light ? "#627db1" : "#b6caf9";
      context.shadowColor = light ? "#7995c7" : "#a9c1ff";
      context.shadowBlur = 12;
      context.lineWidth = 1.3;
      context.globalAlpha = hover * .5;
      context.beginPath();
      context.arc(pointerX, pointerY, rippleRadius * .72 + Math.sin(time * .002) * 2, 0, Math.PI * 2);
      context.stroke();
      context.shadowBlur = 0;
      context.globalAlpha = hover * .18;
      context.beginPath();
      context.arc(pointerX, pointerY, rippleRadius + Math.sin(time * .0015) * 3, 0, Math.PI * 2);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  function tick(time) {
    frameId = window.requestAnimationFrame(tick);
    if (time - lastFrame < 33) return;
    lastFrame = time;
    draw(time);
  }

  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function start() {
    if (!frameId && visible && !document.hidden && !(reducedMotion && reducedMotion.matches)) {
      lastFrame = 0;
      frameId = window.requestAnimationFrame(tick);
    }
  }

  function resize() {
    var bounds = scene.getBoundingClientRect();
    var nextWidth = Math.round(bounds.width);
    var nextHeight = Math.round(bounds.height);
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
    width = nextWidth;
    height = nextHeight;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createPoints();
    draw(0);
    scene.classList.add("is-ready");
  }

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(scene);
  else window.addEventListener("resize", resize);
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }, { rootMargin: "100px" }).observe(scene);
  } else start();

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("site-theme-change", function () { draw(lastFrame); });
  scene.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse" || (reducedMotion && reducedMotion.matches)) return;
    var bounds = scene.getBoundingClientRect();
    var nx = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    var ny = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    targetYaw = baseYaw + nx * .48;
    targetPitch = Math.max(.08, Math.min(.38, basePitch - ny * .16));
    targetX = nx * 9;
    targetY = ny * 7;
    targetPointerX = event.clientX - bounds.left;
    targetPointerY = event.clientY - bounds.top;
    targetHover = 1;
  });
  scene.addEventListener("pointerleave", function () {
    targetYaw = baseYaw;
    targetPitch = basePitch;
    targetX = targetY = targetHover = 0;
  });
  if (reducedMotion) {
    var onMotionChange = function () {
      if (reducedMotion.matches) {
        stop();
        yaw = targetYaw = baseYaw;
        pitch = targetPitch = basePitch;
        offsetX = offsetY = targetX = targetY = targetHover = hover = 0;
        draw(0);
      } else start();
    };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onMotionChange);
    else reducedMotion.addListener(onMotionChange);
  }
})();
