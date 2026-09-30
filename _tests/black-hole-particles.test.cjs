const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const test = require("node:test");

const script = readFileSync(join(__dirname, "../assets/js/black-hole-particles.js"), "utf8");

function mount({ width = 520, height = 420, reduced = false, ratio = 1, staleStyles = false } = {}) {
  const frames = new Map();
  const events = {};
  const colors = new Set();
  const classes = new Set();
  let drawn = 0;
  let nextFrame = 0;
  let theme = "dark";
  let observer;
  let onMotionChange;
  let onResize;
  let arcs = [];
  let fills = [];
  let strokes = 0;

  const context = {
    clearRect() { arcs = []; fills = []; strokes = 0; }, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {}, beginPath() {}, fillRect() {}, moveTo() {}, lineTo() {}, bezierCurveTo() {},
    createRadialGradient() { return { addColorStop(offset, color) { colors.add(color); } }; },
    createLinearGradient() { return { addColorStop() {} }; },
    arc(x, y, radius) { arcs.push([x, y, radius]); },
    stroke() { strokes++; },
    fill() { drawn++; colors.add(this.fillStyle); fills.push([arcs.at(-1)[0], arcs.at(-1)[1], this.fillStyle, this.globalAlpha, arcs.at(-1)[2]]); }
  };
  const scene = {
    style: {},
    classList: { add(name) { classes.add(name); } },
    getBoundingClientRect() {
      return { width, height: staleStyles ? 300 + (canvas.style.position === "absolute" ? 0 : canvas.height) : height, left: 0, top: 0 };
    },
    addEventListener(name, handler) { events[`scene:${name}`] = handler; }
  };
  const canvas = { parentElement: scene, style: {}, height: 150, getContext() { return context; } };
  const motion = { matches: reduced, addEventListener(name, handler) { onMotionChange = handler; } };
  const document = {
    hidden: false,
    documentElement: { getAttribute() { return theme; } },
    querySelector() { return canvas; },
    addEventListener(name, handler) { events[`document:${name}`] = handler; }
  };
  class IntersectionObserver {
    constructor(callback) { observer = callback; }
    observe() { observer([{ isIntersecting: true }]); }
  }
  class ResizeObserver {
    constructor(callback) { onResize = callback; }
    observe() {}
  }
  const window = {
    devicePixelRatio: ratio,
    matchMedia() { return motion; },
    IntersectionObserver,
    ResizeObserver,
    requestAnimationFrame(callback) { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, handler) { events[`window:${name}`] = handler; }
  };

  runInNewContext(script, { document, window, IntersectionObserver, ResizeObserver, Math });
  return {
    canvas, classes, colors, document, events, frames, motion, scene,
    arcs() { return arcs; },
    fills() { return fills; },
    strokes() { return strokes; },
    drawn() { return drawn; },
    resize() { onResize(); },
    frame(time) {
      const next = frames.entries().next().value;
      if (!next) return;
      frames.delete(next[0]);
      next[1](time);
    },
    pointer(x, y, pointerType = "mouse") { events["scene:pointermove"]({ clientX: x, clientY: y, pointerType }); },
    leave() { events["scene:pointerleave"](); },
    inView(value) { observer([{ isIntersecting: value }]); },
    setTheme(value) { theme = value; events["window:site-theme-change"](); },
    setReduced(value) { motion.matches = value; onMotionChange(); }
  };
}

const darkColors = new Set(["#14243a", "#203651", "#304a68", "#405d7d"]);
const sphereDots = page => page.fills().filter(dot => darkColors.has(dot[2]));
const arcDots = page => page.fills().filter(dot => dot[2] === "#ffe4b5"
  && dot[1] < page.scene.getBoundingClientRect().height * .49);

// Follow isolated size/position fingerprints in small time steps, rather than
// relying on depth-sorted draw indices (which change as particles move).
// Ambiguous matches are discarded so a nearby, different dot cannot masquerade
// as motion of the original particle.
function trackParticles(page, select, { duration = 2400, choose = () => true } = {}) {
  let tracks = select(page).filter(choose).sort((a, b) => b[4] - a[4]).slice(0, 80)
    .map(dot => ({ first: dot, last: dot, history: [dot] }));
  for (let time = 40; time <= duration; time += 40) {
    page.frame(time);
    const dots = select(page);
    tracks = tracks.filter(track => {
      const candidates = dots.filter(dot => Math.abs(dot[4] - track.last[4]) < .006
        && Math.hypot(dot[0] - track.last[0], dot[1] - track.last[1]) < 2.5)
        .map(dot => ({ dot, score: Math.hypot(dot[0] - track.last[0], dot[1] - track.last[1])
          + Math.abs(dot[4] - track.last[4]) * 150 }))
        .sort((a, b) => a.score - b.score);
      if (!candidates.length || (candidates[1] && candidates[1].score < candidates[0].score * 3)) return false;
      track.last = candidates[0].dot;
      track.history.push(track.last);
      return true;
    });
  }
  return tracks;
}

test("idle sphere particles rotate independently of camera sway and scene drift", () => {
  const page = mount();
  const tracks = trackParticles(page, sphereDots);
  assert.ok(tracks.length >= 3, `only ${tracks.length} unambiguous sphere fingerprints survived`);
  const displacement = Math.max(...tracks.map(({ first, last }) => Math.hypot(last[0] - first[0],
    last[1] - first[1] - Math.sin(2400 * .0007) * 4)));
  assert.ok(displacement > 18, `sphere self-rotation displacement was ${displacement}`);
  assert.ok(sphereDots(page).every(dot => Math.hypot(dot[0] - 260,
    dot[1] - 205.8 - Math.sin(2400 * .0007) * 4) < 43));
});

test("upper arc particles flow along a stable band beyond camera sway and drift", () => {
  const page = mount();
  const tracks = trackParticles(page, arcDots, { choose: dot => dot[0] < 260 && dot[1] < 180 });
  assert.ok(tracks.length >= 3, `only ${tracks.length} unambiguous arc fingerprints survived`);
  const displacement = Math.max(...tracks.map(({ first, last }) => last[0] - first[0]));
  assert.ok(displacement > 20, `arc flow displacement was ${displacement}`);
});

test("upper arc meets the sphere while keeping its exposed band thick", () => {
  const page = mount({ reduced: true });
  const arc = arcDots(page).filter(dot => Math.abs(dot[0] - 260) < 3 && dot[3] > .08);
  const sphereTop = Math.min(...sphereDots(page).map(dot => dot[1] - dot[4]));
  const arcInnerEdge = Math.max(...arc.map(dot => dot[1] + dot[4]));
  const gap = sphereTop - arcInnerEdge;
  assert.ok(gap >= -4 && gap <= 1, `arc inner-edge gap was ${gap}`);
  // At the top the sphere occludes part of the band. Measure its full thickness
  // off to the side, where the ring is not hidden by the sphere.
  const exposed = arcDots(page).filter(dot => Math.abs(dot[0] - 320) < 3 && dot[3] > .08);
  const ys = exposed.map(dot => dot[1]).sort((a, b) => a - b);
  const thickness = ys[Math.floor(ys.length * .95)] - ys[Math.floor(ys.length * .05)];
  assert.ok(thickness > 17, `arc band thickness was ${thickness}`);
  assert.ok(arcDots(page).length > 2000, "exposed arc must remain well populated");
});

test("lower arc mirrors the upper arc with matching thickness, color and opacity", () => {
  for (const width of [520, 320]) {
    const page = mount({ width, reduced: true });
    const cy = page.scene.getBoundingClientRect().height * .49;
    const dots = page.fills().filter(dot => dot[2] === "#ffe4b5");
    const upper = dots.filter(dot => dot[1] < cy);
    const lower = dots.filter(dot => dot[1] > cy);
    assert.ok(lower.length > 1000, "lower arc must be populated on desktop and mobile");
    assert.equal(lower.length, upper.length);
    const key = dot => [dot[0], dot[1], dot[3], dot[4]].map(value => value.toFixed(6)).join(",");
    const reflected = new Set(lower.map(key));
    assert.ok(upper.every(dot => reflected.has(key([dot[0], 2 * cy - dot[1], dot[2], dot[3], dot[4]]))),
      "every upper particle must have a matching lower reflection");
  }
});

test("lower arc particles flow without pointer input", () => {
  const page = mount();
  const lowerDots = page => page.fills().filter(dot => dot[2] === "#ffe4b5" && dot[1] > 205.8);
  const tracks = trackParticles(page, lowerDots, { choose: dot => dot[0] < 260 && dot[1] > 232 });
  assert.ok(tracks.length >= 3, `only ${tracks.length} unambiguous lower arc fingerprints survived`);
  const displacement = Math.max(...tracks.map(({ first, last }) => last[0] - first[0]));
  assert.ok(displacement > 20, `lower arc flow displacement was ${displacement}`);
});

test("arc flow fades toward the wrap and maintains brightness over repeated cycles", () => {
  const page = mount();
  const tracks = trackParticles(page, arcDots, {
    duration: 1600, choose: dot => dot[0] > 335 && dot[0] < 355
  });
  assert.ok(tracks.length >= 3, `only ${tracks.length} unambiguous endpoint fingerprints survived`);
  const fading = tracks.filter(({ first, last }) => last[0] - first[0] > 12 && last[3] < first[3] * .6);
  assert.ok(fading.length > 0, "moving arc particles should fade as they approach the wrap");

  const brightness = () => arcDots(page).reduce((sum, dot) => sum + dot[3], 0);
  const initialBrightness = brightness();
  for (const time of [4000, 8000, 12000, 15320, 15360, 15400, 15440, 20000, 30720, 30760, 30800, 30840, 46160]) {
    page.frame(time);
    assert.ok(Math.abs(brightness() / initialBrightness - 1) < .18,
      `arc brightness changed at ${time}ms (wrap must not accumulate opacity changes)`);
    // The screen-space endpoint zone includes scatter and perspective, and the
    // left end can be in front of the camera (without the .55 rear attenuation).
    // Even those particles must stay below a quarter of full opacity.
    const ends = arcDots(page).filter(dot => Math.abs(dot[0] - 260) > 119);
    assert.ok(ends.length > 0);
    assert.ok(ends.every(dot => dot[3] < .25),
      `arc endpoint at ${time}ms: ${JSON.stringify(ends.reduce((a, b) => a[3] > b[3] ? a : b))}`);
  }

  let previousBrightness;
  for (let time = 61440; time <= 61680; time += 40) {
    page.frame(time);
    const current = brightness();
    if (previousBrightness !== undefined) {
      assert.ok(Math.abs(current / previousBrightness - 1) < .025,
        `arc brightness jumped across a wrap at ${time}ms`);
    }
    previousBrightness = current;
  }
});

test("disk orbital motion uses the faster approved idle speed", () => {
  const page = mount();
  const first = page.fills().find(dot => dot[2] === "#fff0cc");
  page.frame(2000);
  const last = page.fills().find(dot => dot[2] === "#fff0cc");
  const displacement = first[0] - last[0];
  assert.ok(displacement > 50, `disk flare orbital displacement was ${displacement}`);
});

test("reduced motion resets animation and redraws the same static particles across themes", () => {
  const page = mount();
  page.pointer(350, 205);
  for (let time = 40; time <= 2000; time += 40) page.frame(time);
  page.setReduced(true);
  const still = mount({ reduced: true });
  assert.deepEqual(page.fills(), still.fills());
  const snapshot = page.fills();
  page.pointer(20, 20);
  page.setTheme("light");
  assert.deepEqual(page.fills().map(dot => [dot[0], dot[1], dot[3], dot[4]]),
    snapshot.map(dot => [dot[0], dot[1], dot[3], dot[4]]));
  page.setTheme("dark");
  assert.deepEqual(page.fills(), snapshot);
  assert.equal(page.frames.size, 0);
});

test("renders an accretion disk around a dark event horizon and pauses offscreen", () => {
  const page = mount();
  assert.ok(page.drawn() > 5000);
  assert.ok(["#ffe0a7", "#ffb376", "#a3bdf6", "#ffe4b5", "#14243a"].every(color => page.colors.has(color)));
  const darkDots = page.fills().filter(dot => ["#14243a", "#203651", "#304a68", "#405d7d"].includes(dot[2]));
  assert.ok(darkDots.length > 2000);
  const sizes = page.arcs().map(arc => arc[2]);
  assert.ok(Math.max(...sizes) > Math.min(...sizes) * 2);
  assert.ok(page.classes.has("is-ready"));
  assert.equal(page.frames.size, 1);
  page.inView(false);
  assert.equal(page.frames.size, 0);
  page.inView(true);
  assert.equal(page.frames.size, 1);
  page.document.hidden = true;
  page.events["document:visibilitychange"]();
  assert.equal(page.frames.size, 0);
});

test("keeps the page height stable when a browser has cached the previous stylesheet", () => {
  const page = mount({ staleStyles: true });
  const initialHeight = page.scene.getBoundingClientRect().height;
  for (let i = 0; i < 10; i++) page.resize();
  assert.ok(page.scene.getBoundingClientRect().height <= initialHeight + 1);
});

test("mouse movement rotates an asymmetric disk flare in three dimensions", () => {
  const left = mount();
  const right = mount();
  left.pointer(20, 210);
  right.pointer(500, 210);
  for (let i = 0; i < 26; i++) {
    left.frame(100 + i * 40);
    right.frame(100 + i * 40);
  }
  function surfaceGap(page) {
    function center(color) {
      const dots = page.fills().filter(dot => dot[2] === color);
      return dots.reduce((sum, dot) => sum + dot[0], 0) / dots.length;
    }
    return center("#fff0cc") - center("#ffe0a7");
  }
  const displacement = Math.abs(surfaceGap(left) - surfaceGap(right));
  assert.ok(displacement > 8, `flare rotation displacement was ${displacement}`);
});

test("mouse movement disturbs nearby particles without drawing a solid ring", () => {
  const page = mount();
  const control = mount();
  page.frame(100);
  control.frame(100);
  assert.equal(page.strokes(), 0);
  page.pointer(350, 205);
  for (let i = 0; i < 15; i++) {
    page.frame(150 + i * 40);
    control.frame(150 + i * 40);
  }
  const luminous = new Set(["#ffe0a7", "#ffb376", "#ffe4b5", "#ffdda7"]);
  function nearbyBrightness(site) {
    return site.fills().filter(dot => luminous.has(dot[2]) && Math.hypot(dot[0] - 350, dot[1] - 205) < 35)
      .reduce((sum, dot) => sum + dot[3], 0);
  }
  assert.ok(nearbyBrightness(page) < nearbyBrightness(control) * .9);

  page.leave();
  for (let i = 0; i < 60; i++) {
    page.frame(800 + i * 40);
  }
  assert.equal(page.strokes(), 0);
  assert.ok(page.colors.has("#14243a"));
});

test("hovering the center animates dark particles while preserving the round silhouette", () => {
  const page = mount();
  page.frame(100);
  page.pointer(260, 205);
  for (let i = 0; i < 15; i++) page.frame(150 + i * 40);
  const dark = new Set(["#14243a", "#203651", "#304a68", "#405d7d", "#55749e"]);
  const sphere = page.fills().filter(dot => dark.has(dot[2]));
  assert.ok(sphere.filter(dot => dot[2] === "#55749e").length > 30);
  assert.ok(sphere.every(dot => Math.hypot(dot[0] - 260, dot[1] - 205) < 55));

  page.leave();
  for (let i = 0; i < 60; i++) page.frame(800 + i * 40);
  assert.equal(page.fills().filter(dot => dot[2] === "#55749e").length, 0);
});

test("touch and reduced-motion users do not get a mouse ripple", () => {
  const page = mount({ reduced: true });
  page.pointer(260, 205);
  assert.equal(page.frames.size, 0);
  page.setTheme("light");
  assert.equal(page.strokes(), 0);

  const touch = mount();
  touch.pointer(260, 205, "touch");
  touch.frame(100);
  assert.equal(touch.strokes(), 0);
});

test("reduces detail on small screens and keeps a still image for reduced motion", () => {
  const desktop = mount();
  const mobile = mount({ width: 320, height: 320, reduced: true, ratio: 3 });
  assert.ok(mobile.drawn() < desktop.drawn());
  assert.ok(mobile.drawn() > 500);
  assert.equal(mobile.canvas.width, 640);
  assert.equal(mobile.frames.size, 0);
  mobile.setReduced(false);
  assert.equal(mobile.frames.size, 1);
  mobile.setReduced(true);
  assert.equal(mobile.frames.size, 0);
  mobile.setTheme("light");
  assert.ok(mobile.colors.has("#2e405a"));
});
