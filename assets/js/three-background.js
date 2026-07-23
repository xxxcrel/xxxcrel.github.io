import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

(function () {
  var canvas = document.getElementById("scene");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!canvas || reducedMotion.matches) return;

  var root = document.documentElement;
  var renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power"
    });
  } catch (error) {
    return;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  var group = new THREE.Group();
  var pointer = new THREE.Vector2(0, 0);
  var targetPointer = new THREE.Vector2(0, 0);
  var clock = new THREE.Clock();
  var frameId = 0;
  var visible = true;
  var isCompact = window.innerWidth < 768;
  var particleCount = isCompact ? 260 : 620;
  var positions = new Float32Array(particleCount * 3);
  var colors = new Float32Array(particleCount * 3);
  var geometry = new THREE.BufferGeometry();
  var material = new THREE.PointsMaterial({
    size: isCompact ? 0.026 : 0.022,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  for (var index = 0; index < particleCount; index += 1) {
    var radius = 2.6 + Math.random() * 4.8;
    var angle = Math.random() * Math.PI * 2;
    var elevation = (Math.random() - 0.5) * 4.2;
    var offset = index * 3;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = elevation;
    positions[offset + 2] = Math.sin(angle) * radius - 1.2;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  var particles = new THREE.Points(geometry, material);
  group.add(particles);
  scene.add(group);
  camera.position.z = 7.5;

  function updatePalette() {
    var light = root.getAttribute("data-theme") === "light";
    var primary = new THREE.Color(light ? 0x2a7fff : 0x73e0ff);
    var secondary = new THREE.Color(light ? 0x0d9488 : 0xb8fff6);

    for (var index = 0; index < particleCount; index += 1) {
      var color = index % 4 === 0 ? secondary : primary;
      var offset = index * 3;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }

    geometry.attributes.color.needsUpdate = true;
    material.opacity = light ? 0.38 : 0.62;
  }

  function resize() {
    var width = window.innerWidth;
    var height = Math.max(window.innerHeight, document.documentElement.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact ? 1.25 : 1.6));
    renderer.setSize(width, height, false);
  }

  function render() {
    if (!visible) return;

    var elapsed = clock.getElapsedTime();
    pointer.lerp(targetPointer, 0.035);
    group.rotation.y = elapsed * 0.018 + pointer.x * 0.08;
    group.rotation.x = Math.sin(elapsed * 0.12) * 0.025 + pointer.y * 0.04;
    particles.rotation.z = elapsed * 0.006;

    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(render);
  }

  function onPointerMove(event) {
    targetPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetPointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  }

  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    window.cancelAnimationFrame(frameId);
    if (visible) {
      clock.getDelta();
      render();
    }
  });

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("site-theme-change", updatePalette);
  reducedMotion.addEventListener("change", function (event) {
    if (event.matches) {
      window.cancelAnimationFrame(frameId);
      canvas.style.display = "none";
    }
  });

  updatePalette();
  resize();
  render();
})();
