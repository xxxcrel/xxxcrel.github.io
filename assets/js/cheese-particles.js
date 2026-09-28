(function () {
  "use strict";

  var canvas = document.querySelector("[data-cheese-particles]");
  if (!canvas || !canvas.getContext) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  var scene = canvas.parentElement;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var top = [[-205, -50], [55, -140], [210, -63]];
  var front = [[-205, -50], [210, -63], [-205, 60]];
  var faces = [
    { name: "top", polygon: top, holes: [[-50, -76, 17, 7], [65, -103, 25, 11], [145, -80, 12, 6]], count: 760 },
    { name: "front", polygon: front, holes: [[-145, -16, 22, 14], [-152, 28, 14, 10], [-22, -27, 18, 11]], count: 820 }
  ];
  var points = [];
  var width = 0;
  var height = 0;
  var frameId = 0;
  var lastFrame = 0;
  var visible = !window.IntersectionObserver;
  var offsetX = 0;
  var offsetY = 0;
  var targetX = 0;
  var targetY = 0;

  function insidePolygon(x, y, polygon) {
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var a = polygon[i];
      var b = polygon[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  function inHole(x, y, holes) {
    return holes.some(function (hole) {
      var dx = (x - hole[0]) / hole[2];
      var dy = (y - hole[1]) / hole[3];
      return dx * dx + dy * dy < 1;
    });
  }

  function createPoints() {
    // A fixed seed keeps the cheese stable across resizes and theme changes.
    var seed = 271828;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    }
    function add(x, y, face, opacity) {
      points.push({ x: x, y: y, face: face, opacity: opacity, radius: .55 + random() * 1.05, phase: random() * Math.PI * 2 });
    }

    points = [];
    var density = width < 480 ? .52 : 1;
    faces.forEach(function (face) {
      var target = Math.round(face.count * density);
      var bounds = face.polygon.reduce(function (box, vertex) {
        return [Math.min(box[0], vertex[0]), Math.min(box[1], vertex[1]), Math.max(box[2], vertex[0]), Math.max(box[3], vertex[1])];
      }, [Infinity, Infinity, -Infinity, -Infinity]);
      var added = 0;
      while (added < target) {
        var x = bounds[0] + random() * (bounds[2] - bounds[0]);
        var y = bounds[1] + random() * (bounds[3] - bounds[1]);
        if (!insidePolygon(x, y, face.polygon) || inHole(x, y, face.holes)) continue;
        add(x, y, face.name, .35 + random() * .58);
        added++;
      }

      face.polygon.forEach(function (point, index) {
        var next = face.polygon[(index + 1) % face.polygon.length];
        var steps = Math.hypot(next[0] - point[0], next[1] - point[1]) / (width < 480 ? 8 : 5);
        for (var i = 0; i < steps; i++) {
          var progress = i / steps;
          add(point[0] + (next[0] - point[0]) * progress, point[1] + (next[1] - point[1]) * progress, "rim", .58 + random() * .4);
        }
      });
      face.holes.forEach(function (hole) {
        var steps = Math.ceil(Math.PI * (hole[2] + hole[3]) / (width < 480 ? 6 : 4));
        for (var i = 0; i < steps; i++) {
          var angle = (i + random() * .3) / steps * Math.PI * 2;
          add(hole[0] + Math.cos(angle) * hole[2], hole[1] + Math.sin(angle) * hole[3], "rim", .55 + random() * .4);
        }
      });
    });

    for (var i = 0; i < 75 * density; i++) {
      var x = -280 + random() * 570;
      var y = -185 + random() * 355;
      if (!insidePolygon(x, y, top) && !insidePolygon(x, y, front)) add(x, y, "dust", .1 + random() * .25);
    }
  }

  function draw(time) {
    if (!width || !height) return;
    var light = document.documentElement.getAttribute("data-theme") === "light";
    var colors = light
      ? { top: "#a9600e", front: "#b96e21", rim: "#92500a", dust: "#a66e36" }
      : { top: "#ffd788", front: "#ffb65c", rim: "#ffe4a4", dust: "#ffbd71" };
    var still = reducedMotion && reducedMotion.matches;

    context.clearRect(0, 0, width, height);
    context.save();
    offsetX += (targetX - offsetX) * .06;
    offsetY += (targetY - offsetY) * .06;
    context.translate(width * .5 + offsetX, height * .49 + offsetY);
    context.scale(Math.min(width / 500, height / 390), Math.min(width / 500, height / 390));
    if (!still) {
      context.translate(0, Math.sin(time * .0007) * 5);
      context.rotate(Math.sin(time * .00028) * .024);
    }

    points.forEach(function (point) {
      var shimmer = still ? 1 : .87 + .13 * Math.sin(time * .0017 + point.phase);
      var drift = still ? 0 : Math.sin(time * .0008 + point.phase) * (point.face === "dust" ? 2.5 : .75);
      context.globalAlpha = point.opacity * shimmer;
      context.fillStyle = colors[point.face];
      context.beginPath();
      context.arc(point.x + drift, point.y + drift * .6, point.radius, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
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
    targetX = (event.clientX - bounds.left - bounds.width / 2) * .045;
    targetY = (event.clientY - bounds.top - bounds.height / 2) * .045;
  });
  scene.addEventListener("pointerleave", function () { targetX = targetY = 0; });
  if (reducedMotion) {
    var onMotionChange = function () {
      if (reducedMotion.matches) { stop(); draw(0); }
      else start();
    };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", onMotionChange);
    else reducedMotion.addListener(onMotionChange);
  }
})();
