import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

(function () {
  var canvas = document.getElementById("scene");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!canvas || reducedMotion.matches) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  } catch (error) { return; }

  var compact = window.innerWidth < 768;
  var count = compact ? 900 : 2600;
  var positions = new Float32Array(count * 3);
  var colors = new Float32Array(count * 3);
  var phases = new Float32Array(count);
  var geometry = new THREE.BufferGeometry();
  var material = new THREE.PointsMaterial({ size: compact ? .018 : .014, transparent: true, opacity: .68, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true });
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  var cloud = new THREE.Points(geometry, material);
  var clock = new THREE.Clock();
  var pointer = new THREE.Vector2();
  var target = new THREE.Vector2();
  var frameId = 0;
  var visible = true;

  function whalePoint(index) {
    var t = Math.random();
    var x;
    var y;
    if (t < .73) {
      var angle = Math.random() * Math.PI * 2;
      var radius = Math.sqrt(Math.random());
      x = Math.cos(angle) * (0.48 + Math.random() * .14) * radius;
      y = Math.sin(angle) * .22 * radius;
      y += .025 * Math.sin(x * 7);
    } else if (t < .89) {
      x = -.48 - Math.random() * .36;
      y = (Math.random() - .5) * (.28 + (x + .48) * -.15);
    } else if (t < .96) {
      x = .42 + Math.random() * .25;
      y = -.05 - Math.random() * .18 + Math.abs(x - .54) * .35;
    } else {
      x = -.05 + Math.random() * .28;
      y = -.15 - Math.random() * .25;
    }
    return [x, y];
  }

  for (var index = 0; index < count; index += 1) {
    var point = whalePoint(index);
    var offset = index * 3;
    positions[offset] = point[0];
    positions[offset + 1] = point[1];
    positions[offset + 2] = (Math.random() - .5) * .08;
    phases[index] = Math.random() * Math.PI * 2;
    var brightness = .28 + Math.random() * .72;
    colors[offset] = .18 * brightness;
    colors[offset + 1] = .58 * brightness;
    colors[offset + 2] = brightness;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  scene.add(cloud);

  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  function render() {
    if (!visible) return;
    var elapsed = clock.getElapsedTime();
    pointer.lerp(target, .025);
    cloud.position.x = .21 + pointer.x * .025;
    cloud.position.y = .15 + pointer.y * .018 + Math.sin(elapsed * .32) * .012;
    cloud.rotation.z = -.13 + pointer.x * .025;
    material.opacity = .54 + Math.sin(elapsed * .7) * .08;
    frameId = requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; cancelAnimationFrame(frameId); if (visible) { clock.getDelta(); render(); } });
  document.addEventListener("pointermove", function (event) { target.x = event.clientX / window.innerWidth * 2 - 1; target.y = -(event.clientY / window.innerHeight * 2 - 1); }, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  reducedMotion.addEventListener("change", function (event) { if (event.matches) { cancelAnimationFrame(frameId); canvas.style.display = "none"; } });
  resize(); render();
})();
