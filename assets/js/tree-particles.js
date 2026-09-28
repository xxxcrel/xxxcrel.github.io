(function () {
  "use strict";

  var canvas = document.querySelector("[data-tree-particles]");
  if (!canvas || !canvas.getContext) return;
  var context = canvas.getContext("2d");
  if (!context) return;

  var scene = canvas.parentElement;
  // An absolutely positioned canvas cannot feed its intrinsic height back into
  // the measured scene when a browser has cached an older stylesheet.
  scene.style.position = "relative";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var layers = [
    { tip: -148, base: -18, radius: 55, count: 700, face: "crown" },
    { tip: -100, base: 57, radius: 88, count: 1020, face: "middle" },
    { tip: -46, base: 121, radius: 124, count: 1380, face: "lower" }
  ];
  var points = [];
  var width = 0;
  var height = 0;
  var frameId = 0;
  var lastFrame = 0;
  var visible = !window.IntersectionObserver;
  var baseYaw = .28;
  var basePitch = .12;
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

  function foliageRadius(y) {
    return layers.reduce(function (radius, layer) {
      if (y < layer.tip || y > layer.base) return radius;
      return Math.max(radius, layer.radius * (y - layer.tip) / (layer.base - layer.tip));
    }, 0);
  }

  function createPoints() {
    var seed = 271828;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    }
    function add(x, y, z, face, opacity, size) {
      points.push({ x: x, y: y, z: z, face: face, opacity: opacity, radius: size || .65 + random() * 1.15, phase: random() * Math.PI * 2 });
    }

    points = [];
    var density = width < 480 ? .55 : 1;
    // Three uneven cones give the tree a layered silhouette at every angle.
    layers.forEach(function (layer, index) {
      for (var i = 0; i < layer.count * density; i++) {
        var t = Math.sqrt(random());
        var angle = random() * Math.PI * 2;
        var y = layer.tip + (layer.base - layer.tip) * t;
        var branches = .91 + random() * .14 + Math.sin(angle * 9 + y * .065) * .035;
        var radius = layer.radius * t * branches;
        add(Math.cos(angle) * radius, y, Math.sin(angle) * radius, layer.face, .42 + random() * .55);
      }
      for (var j = 0, count = Math.round(110 * density); j < count; j++) {
        var angle = j / count * Math.PI * 2;
        var radius = layer.radius * (.92 + .07 * Math.sin(angle * 8 + index));
        add(Math.cos(angle) * radius, layer.base - random() * 6, Math.sin(angle) * radius, layer.face, .57 + random() * .35);
      }
    });

    for (var i = 0; i < 240 * density; i++) {
      var angle = random() * Math.PI * 2;
      var y = 115 + random() * 45;
      var radius = 14 + random() * 5;
      add(Math.cos(angle) * radius, y, Math.sin(angle) * radius, "trunk", .45 + random() * .45);
    }

    var garlandCount = Math.round(290 * density);
    for (var i = 0; i < garlandCount; i++) {
      var t = i / (garlandCount - 1);
      var y = -125 + t * 235;
      var angle = t * Math.PI * 6 + .7;
      var radius = foliageRadius(y) * 1.025;
      add(Math.cos(angle) * radius, y, Math.sin(angle) * radius, "garland", .55 + random() * .35, .85 + random() * .45);
    }

    for (var i = 0; i < 95 * density; i++) {
      var y = -115 + random() * 215;
      var angle = random() * Math.PI * 2;
      var radius = foliageRadius(y) * 1.05;
      var ornament = random();
      var face = ornament < .39 ? "ruby" : ornament < .74 ? "gold" : "ice";
      add(Math.cos(angle) * radius, y, Math.sin(angle) * radius, face, .8 + random() * .2, 2 + random() * 1.3);
    }
    add(62, 72, 62, "feature", 1, 3.8);

    var star = [];
    for (var i = 0; i < 10; i++) {
      var angle = -Math.PI / 2 + i * Math.PI / 5;
      var radius = i % 2 ? 6 : 15;
      star.push([Math.cos(angle) * radius, -160 + Math.sin(angle) * radius]);
    }
    for (var i = 0; i < star.length; i++) {
      var next = star[(i + 1) % star.length];
      for (var j = 0, count = width < 480 ? 7 : 11; j < count; j++) {
        var t = j / count;
        add(star[i][0] + (next[0] - star[i][0]) * t, star[i][1] + (next[1] - star[i][1]) * t, 9, "star", .75 + random() * .25, 1.1 + random() * .5);
      }
    }
    for (var i = 0; i < 30 * density; i++) {
      add((random() - .5) * 7, -161 + (random() - .5) * 7, 8 + random() * 4, "star", .65 + random() * .3);
    }

    for (var i = 0; i < 70 * density; i++) {
      add(-175 + random() * 350, -180 + random() * 370, -140 + random() * 280, "dust", .08 + random() * .22);
    }
  }

  function draw(time) {
    if (!width || !height) return;
    var still = reducedMotion && reducedMotion.matches;
    var light = document.documentElement.getAttribute("data-theme") === "light";
    var colors = light
      ? { crown: "#24875f", middle: "#227d57", lower: "#1d704d", trunk: "#88512c", garland: "#956111", ruby: "#ad3850", feature: "#b3284c", gold: "#a46d1b", ice: "#436eab", star: "#b47a17", dust: "#599976" }
      : { crown: "#b0eac6", middle: "#8dd9ad", lower: "#6bc896", trunk: "#c18b58", garland: "#ffe09a", ruby: "#ff8490", feature: "#ff5d75", gold: "#ffd084", ice: "#a9d9ff", star: "#ffe3a0", dust: "#a8d9bf" };
    var scale = Math.min(width / 410, height / 365);
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
      context.strokeStyle = light ? "#347b61" : "#b6ecd0";
      context.shadowColor = light ? "#59a688" : "#8adbb1";
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
