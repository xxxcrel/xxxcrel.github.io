(function () {
  "use strict";

  var canvas = document.querySelector("[data-cheese-particles]");
  if (!canvas || !canvas.getContext) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  var scene = canvas.parentElement;
  // The canvas must not contribute to its own measured size: an older cached
  // stylesheet otherwise creates a ResizeObserver / intrinsic-height loop.
  scene.style.position = "relative";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  // A wedge with a thick left edge and a single tip on the right. Each visible
  // surface has its own points; the holes are cut out in that surface's plane.
  var A = [-190, -55, 90];
  var B = [-190, -55, -110];
  var C = [205, -48, 50];
  var D = [-190, 60, 90];
  var E = [-190, 60, -110];
  var frontHoles = [[-135, -15, 23, 15], [-146, 30, 14, 10], [-25, -27, 19, 12]];
  var topHoles = [[-113, -6, 22, 19], [-36, 14, 20, 15], [70, 33, 18, 10]];
  var sideHoles = [[-5, -12, 17, 14], [29, 26, 13, 9]];
  var points = [];
  var width = 0;
  var height = 0;
  var frameId = 0;
  var lastFrame = 0;
  var visible = !window.IntersectionObserver;
  var baseYaw = .38;
  var basePitch = .5;
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

  function inHole(x, y, holes) {
    return holes.some(function (hole) {
      var dx = (x - hole[0]) / hole[2];
      var dy = (y - hole[1]) / hole[3];
      return dx * dx + dy * dy < 1;
    });
  }

  function frontZ(x) { return A[2] + (C[2] - A[2]) * (x - A[0]) / (C[0] - A[0]); }
  function topY(x) { return A[1] + (C[1] - A[1]) * (x - A[0]) / (C[0] - A[0]); }

  function createPoints() {
    var seed = 271828;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    }
    function add(x, y, z, face, opacity) {
      points.push({ x: x, y: y, z: z, face: face, opacity: opacity, radius: .65 + random() * 1.15, phase: random() * Math.PI * 2 });
    }
    function triangle(a, b, c, count, face, holes, coordinates) {
      var added = 0;
      while (added < Math.round(count * density)) {
        var root = Math.sqrt(random());
        var split = random();
        var u = 1 - root;
        var v = root * (1 - split);
        var w = root * split;
        var x = u * a[0] + v * b[0] + w * c[0];
        var y = u * a[1] + v * b[1] + w * c[1];
        var z = u * a[2] + v * b[2] + w * c[2];
        if (holes && inHole(x, coordinates === "top" ? z : y, holes)) continue;
        add(x, y, z, face, .36 + random() * .56);
        added++;
      }
    }
    function edge(a, b) {
      var length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      var steps = Math.ceil(length / (width < 480 ? 8 : 5));
      for (var i = 0; i < steps; i++) {
        var t = i / steps;
        add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, "edge", .63 + random() * .35);
      }
    }

    points = [];
    var density = width < 480 ? .55 : 1;
    triangle(B, E, C, 160, "back");
    triangle(D, C, E, 180, "bottom");
    triangle(A, C, D, 1000, "front", frontHoles, "front");
    triangle(A, B, C, 1250, "top", topHoles, "top");
    for (var i = 0; i < 410 * density; i++) {
      var z = -110 + random() * 200;
      var y = -55 + random() * 115;
      if (!inHole(z, y, sideHoles)) add(-190, y, z, "side", .38 + random() * .55);
    }

    [[A, B], [B, C], [C, A], [A, D], [D, C], [D, E], [E, B], [C, E]].forEach(function (pair) { edge(pair[0], pair[1]); });
    frontHoles.forEach(function (hole) {
      for (var i = 0, count = width < 480 ? 27 : 43; i < count; i++) {
        var angle = i / count * Math.PI * 2;
        var x = hole[0] + Math.cos(angle) * hole[2];
        var y = hole[1] + Math.sin(angle) * hole[3];
        add(x, y, frontZ(x) + 1, "edge", .7 + random() * .25);
        if (i % 2 === 0) add(hole[0] + Math.cos(angle) * hole[2] * .78, hole[1] + Math.sin(angle) * hole[3] * .78, frontZ(x) - 9, "cavity", .25);
      }
    });
    topHoles.forEach(function (hole) {
      for (var i = 0, count = width < 480 ? 28 : 44; i < count; i++) {
        var angle = i / count * Math.PI * 2;
        var x = hole[0] + Math.cos(angle) * hole[2];
        var z = hole[1] + Math.sin(angle) * hole[3];
        add(x, topY(x) - 1, z, "edge", .7 + random() * .25);
        if (i % 2 === 0) add(hole[0] + Math.cos(angle) * hole[2] * .78, topY(x) + 10, hole[1] + Math.sin(angle) * hole[3] * .78, "cavity", .25);
      }
    });
    sideHoles.forEach(function (hole) {
      for (var i = 0, count = width < 480 ? 23 : 36; i < count; i++) {
        var angle = i / count * Math.PI * 2;
        add(-191, hole[1] + Math.sin(angle) * hole[3], hole[0] + Math.cos(angle) * hole[2], "edge", .7 + random() * .25);
      }
    });
    for (var i = 0; i < 65 * density; i++) {
      add(-265 + random() * 540, -165 + random() * 300, -120 + random() * 240, "dust", .09 + random() * .24);
    }
  }

  function draw(time) {
    if (!width || !height) return;
    var still = reducedMotion && reducedMotion.matches;
    var light = document.documentElement.getAttribute("data-theme") === "light";
    var colors = light
      ? { front: "#b96e21", top: "#a9600e", side: "#8d4b16", bottom: "#95521b", back: "#9c6128", edge: "#7d410c", cavity: "#683b1b", dust: "#a66e36" }
      : { front: "#ffb65c", top: "#ffd788", side: "#e69a4e", bottom: "#b97439", back: "#b6865b", edge: "#ffe4a4", cavity: "#ae6936", dust: "#ffbd71" };
    var scale = Math.min(width / 510, height / 365);
    var radius = Math.min(72, width * .16);

    context.clearRect(0, 0, width, height);
    if (!still) {
      yaw += (targetYaw + Math.sin(time * .0003) * .045 - yaw) * .07;
      pitch += (targetPitch + Math.sin(time * .00026) * .025 - pitch) * .07;
      offsetX += (targetX - offsetX) * .06;
      offsetY += (targetY - offsetY) * .06;
      pointerX += (targetPointerX - pointerX) * .2;
      pointerY += (targetPointerY - pointerY) * .2;
      hover += (targetHover - hover) * .14;
    }

    var cosY = Math.cos(yaw);
    var sinY = Math.sin(yaw);
    var cosP = Math.cos(pitch);
    var sinP = Math.sin(pitch);
    var floatY = still ? 0 : Math.sin(time * .0007) * 4;
    var projected = points.map(function (point) {
      var x = point.x * cosY + point.z * sinY;
      var z = point.z * cosY - point.x * sinY;
      var y = point.y * cosP + z * sinP;
      var depth = z * cosP - point.y * sinP;
      var perspective = 680 / (680 - depth);
      return {
        x: width * .5 + offsetX + x * perspective * scale,
        y: height * .49 + offsetY + floatY + y * perspective * scale,
        depth: depth,
        size: perspective * scale * point.radius,
        point: point
      };
    });
    projected.sort(function (a, b) { return a.depth - b.depth; });

    projected.forEach(function (item) {
      var point = item.point;
      var drift = still ? 0 : Math.sin(time * .0008 + point.phase) * (point.face === "dust" ? 2 : .5);
      var x = item.x + drift;
      var y = item.y + drift * .6;
      var shimmer = still ? 1 : .87 + .13 * Math.sin(time * .0017 + point.phase);
      var opacity = point.opacity * shimmer * Math.min(1.15, .78 + (item.depth + 90) / 420);
      if (!still && hover > .002 && point.face !== "dust") {
        var dx = x - pointerX;
        var dy = y - pointerY;
        var distance = Math.hypot(dx, dy);
        if (distance < radius * 1.5) {
          var push = radius * .43 * hover * Math.exp(-distance * distance / (radius * radius * .45));
          if (distance > .01) {
            x += dx / distance * push;
            y += dy / distance * push;
          }
          opacity *= 1 - .78 * hover * Math.exp(-distance * distance / (radius * radius * .22));
        }
      }
      context.globalAlpha = Math.min(1, opacity);
      context.fillStyle = colors[point.face];
      context.beginPath();
      context.arc(x, y, item.size, 0, Math.PI * 2);
      context.fill();
    });

    if (!still && hover > .01) {
      context.strokeStyle = light ? "#a9600e" : "#ffce84";
      context.shadowColor = light ? "#c47b29" : "#ffd78e";
      context.shadowBlur = 12;
      context.lineWidth = 1.4;
      context.globalAlpha = hover * .58;
      context.beginPath();
      context.arc(pointerX, pointerY, radius * .72 + Math.sin(time * .002) * 2, 0, Math.PI * 2);
      context.stroke();
      context.shadowBlur = 0;
      context.globalAlpha = hover * .2;
      context.beginPath();
      context.arc(pointerX, pointerY, radius + Math.sin(time * .0015) * 3, 0, Math.PI * 2);
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
    targetPitch = basePitch - ny * .28;
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
