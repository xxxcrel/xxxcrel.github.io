(function () {
  "use strict";

  var canvas = document.querySelector("[data-ambient-grid]");
  if (!canvas || !canvas.getContext) return;
  var context = canvas.getContext("2d");
  if (!context) return;
  var isHome = !!document.querySelector(".home-hero");

  // Keep the decoration behind the content even if a previous CSS build is cached.
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "0";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var hoverDevice = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");
  var width = 0;
  var height = 0;
  var frameId = 0;
  var lastFrame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var targetX = 0;
  var targetY = 0;
  var hover = 0;
  var targetHover = 0;

  function animated() {
    return !(reducedMotion && reducedMotion.matches) && (!hoverDevice || hoverDevice.matches);
  }

  function draw(time) {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);

    var motion = animated();
    if (motion) {
      pointerX += (targetX - pointerX) * .17;
      pointerY += (targetY - pointerY) * .17;
      hover += (targetHover - hover) * .12;
    }
    var light = document.documentElement.getAttribute("data-theme") === "light";
    context.strokeStyle = light
      ? (isHome ? "rgba(65, 91, 142, .09)" : "rgba(65, 91, 142, .055)")
      : (isHome ? "rgba(150, 181, 243, .075)" : "rgba(150, 181, 243, .045)");
    context.lineWidth = 1;
    context.lineCap = "round";
    context.lineJoin = "round";
    var spacing = width < 640 ? 76 : 90;
    var step = 14;

    function warp(x, y) {
      var waveX = motion ? Math.sin(time * .00034 + y * .007 + x * .003) * .55 : 0;
      var waveY = motion ? Math.cos(time * .00031 + x * .008 - y * .004) * .55 : 0;
      if (hover > .002) {
        var dx = x - pointerX;
        var dy = y - pointerY;
        var distanceSquared = dx * dx + dy * dy;
        // A continuous field avoids the sharp center and cutoff of a radial push.
        var force = Math.exp(-distanceSquared / 26000) * hover;
        waveX += (dx * .29 - dy * .07) * force;
        waveY += (dy * .29 + dx * .07) * force;
      }
      return [x + waveX, y + waveY];
    }

    function strokeLine(vertical, base, end) {
      var previous = warp(vertical ? base : -step, vertical ? -step : base);
      context.beginPath();
      context.moveTo(previous[0], previous[1]);
      for (var position = 0; position <= end + step; position += step) {
        var next = warp(vertical ? base : position, vertical ? position : base);
        context.quadraticCurveTo(previous[0], previous[1], (previous[0] + next[0]) / 2, (previous[1] + next[1]) / 2);
        previous = next;
      }
      context.lineTo(previous[0], previous[1]);
      context.stroke();
    }

    for (var x = spacing / 2; x < width + spacing; x += spacing) {
      strokeLine(true, x, height);
    }
    for (var y = spacing / 2; y < height + spacing; y += spacing) {
      strokeLine(false, y, width);
    }
  }

  function tick(time) {
    frameId = window.requestAnimationFrame(tick);
    if (time - lastFrame < 40) return;
    lastFrame = time;
    draw(time);
  }

  function stop() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function start() {
    if (!frameId && !document.hidden && animated()) {
      lastFrame = 0;
      frameId = window.requestAnimationFrame(tick);
    }
  }

  function resize() {
    var nextWidth = window.innerWidth;
    var nextHeight = window.innerHeight;
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
    width = nextWidth;
    height = nextHeight;
    var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(0);
  }

  window.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse" || !animated()) return;
    targetX = event.clientX;
    targetY = event.clientY;
    targetHover = 1;
  });
  window.addEventListener("pointerout", function (event) { if (!event.relatedTarget) targetHover = 0; });
  window.addEventListener("blur", function () { targetHover = 0; });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("site-theme-change", function () { draw(lastFrame); });

  function onMotionChange() {
    if (animated()) start();
    else {
      stop();
      hover = targetHover = 0;
      draw(0);
    }
  }
  [reducedMotion, hoverDevice].forEach(function (media) {
    if (!media) return;
    if (media.addEventListener) media.addEventListener("change", onMotionChange);
    else media.addListener(onMotionChange);
  });

  resize();
  start();
})();
