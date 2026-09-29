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
    function addFixed(x, y, z, face, opacity, size) {
      points.push({ x: x, y: y, z: z, face: face, opacity: opacity, size: size, phase: random() * Math.PI * 2 });
    }
    function cubic(a, b, c, d, t) {
      var inverse = 1 - t;
      return inverse * inverse * inverse * a + 3 * inverse * inverse * t * b + 3 * inverse * t * t * c + t * t * t * d;
    }
    function lensPoint(t) {
      var r = 34;
      if (t < .5) {
        t *= 2;
        return [cubic(-3.1 * r, -1.65 * r, -1.55 * r, 0, t), cubic(0, -.12 * r, -1.86 * r, -1.86 * r, t)];
      }
      t = (t - .5) * 2;
      return [cubic(0, 1.55 * r, 1.65 * r, 3.1 * r, t), cubic(-1.86 * r, -1.86 * r, -.12 * r, 0, t)];
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
    for (var i = 0; i < 1700 * density; i++) {
      var t = random();
      var point = lensPoint(t);
      var fade = Math.pow(Math.sin(Math.PI * t), .8);
      addFixed(point[0] + (random() - .5) * 5, point[1] + (random() - .5) * 16,
        -25 + random() * 9, "lensUpper", (.5 + random() * .5) * fade, .8 + random() * 1.1);
    }
    for (var i = 0; i < 450 * density; i++) {
      var t = random();
      var point = lensPoint(t);
      addFixed(point[0] + (random() - .5) * 2, point[1] + (random() - .5) * 5,
        -22 + random() * 5, "lensUpper", .85 * Math.sin(Math.PI * t), .9 + random() * .5);
    }
    for (var i = 0; i < 500 * density; i++) {
      var x = (random() - .5) * 330;
      var fade = Math.pow(Math.max(0, 1 - Math.abs(x) / 165), .7);
      addFixed(x, (random() - .5) * 5, (random() - .5) * 16, "streak", (.4 + random() * .5) * fade, .65 + random() * 1.05);
    }
    for (var i = 0; i < 2500 * density; i++) {
      var angle = random() * Math.PI * 2;
      var radius = 34 * Math.sqrt(random());
      addFixed(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sqrt(34 * 34 - radius * radius),
        "horizon", .72 + random() * .25, .8 + random() * .65);
    }
    for (var i = 0; i < 300 * density; i++) {
      var angle = random() * Math.PI * 2;
      var normalY = random() * 2 - 1;
      var radius = Math.sqrt(1 - normalY * normalY) * 34;
      addFixed(Math.cos(angle) * radius, normalY * 34, Math.sin(angle) * radius,
        "horizon", .55 + random() * .25, .8 + random() * .55);
    }
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
      ? { hot: "#bb6729", amber: "#a5612f", blue: "#506ca2", haze: "#826a9a", flare: "#c77c2e", dust: "#7b83a9", lensUpper: "#a96d35", streak: "#aa713d", horizonCore: "#2e405a", horizonMid: "#3d5470", horizonRim: "#526b87", horizonSpeck: "#627d9b", horizonActive: "#718dad" }
      : { hot: "#ffe0a7", amber: "#ffb376", blue: "#a3bdf6", haze: "#b39bd5", flare: "#fff0cc", dust: "#aab5df", lensUpper: "#ffe4b5", streak: "#ffdda7", horizonCore: "#14243a", horizonMid: "#203651", horizonRim: "#304a68", horizonSpeck: "#405d7d", horizonActive: "#55749e" };
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

    var cosY = Math.cos(yaw);
    var sinY = Math.sin(yaw);
    var cosP = Math.cos(pitch);
    var sinP = Math.sin(pitch);
    var projected = points.map(function (point) {
      var orbit = point.radius !== undefined;
      var angle = orbit ? point.angle + (still ? 0 : time * .00014 * point.speed) : 0;
      var px = orbit ? Math.cos(angle) * point.radius : point.x;
      var pz = orbit ? Math.sin(angle) * point.radius : point.z;
      var py = point.y + (orbit ? Math.sin(angle * 2 + point.radius * .03) * 2 : 0);
      var x = px * cosY + pz * sinY;
      var z = pz * cosY - px * sinY;
      var y = py * cosP + z * sinP;
      var depth = z * cosP - py * sinP;
      var perspective = 690 / (690 - depth);
      return { x: cx + x * perspective * scale, y: cy + y * perspective * scale, depth: depth,
        size: point.size * perspective * scale, point: point };
    });
    projected.sort(function (a, b) { return a.depth - b.depth; });

    function dot(item) {
      var point = item.point;
      var horizon = point.face === "horizon";
      if (!horizon && Math.hypot(item.x - cx, item.y - cy) < holeRadius + 2) return;
      var drift = still ? 0 : Math.sin(time * .0008 + point.phase) * (point.face === "dust" ? 2 : .45);
      var x = item.x + drift;
      var y = item.y + drift * .6;
      var shimmer = still ? 1 : .84 + .16 * Math.sin(time * .002 + point.phase);
      var opacity = point.opacity * shimmer * (item.depth < 0 ? horizon ? .35 : .55 : 1);
      var sphereInfluence = 0;
      if (horizon && !still && hover > .002) {
        var dx = x - pointerX;
        var dy = y - pointerY;
        var edgeRatio = Math.min(1, Math.hypot(x - cx, y - cy) / holeRadius);
        sphereInfluence = hover * Math.exp(-(dx * dx + dy * dy) / (holeRadius * holeRadius * .9)) * (1 - Math.pow(edgeRatio, 4));
        x -= dy * .42 * sphereInfluence;
        y += dx * .42 * sphereInfluence;
        opacity *= 1 + sphereInfluence * .12;
      }
      if (!still && hover > .002 && point.face !== "dust" && !horizon) {
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
      if (horizon) {
        var rim = Math.hypot(x - cx, y - cy) / holeRadius;
        context.fillStyle = sphereInfluence > .16 && point.phase > 4.7 ? colors.horizonActive
          : point.phase > 5.65 ? colors.horizonSpeck
          : rim > .87 && y < cy ? colors.horizonRim : rim > .69 ? colors.horizonMid : colors.horizonCore;
      } else context.fillStyle = colors[point.face];
      context.beginPath();
      context.arc(x, y, item.size, 0, Math.PI * 2);
      context.fill();
    }

    projected.forEach(function (item) { if (item.point.face !== "horizon" && item.depth < 0) dot(item); });
    projected.forEach(function (item) { if (item.point.face === "horizon") dot(item); });
    projected.forEach(function (item) { if (item.point.face !== "horizon" && item.depth >= 0) dot(item); });
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
