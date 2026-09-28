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
    clearRect() { arcs = []; fills = []; strokes = 0; }, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {}, beginPath() {}, fillRect() {},
    createRadialGradient() { return { addColorStop(offset, color) { colors.add(color); } }; },
    arc(x, y, radius) { arcs.push([x, y, radius]); }, stroke() { strokes++; },
    fill() { drawn++; colors.add(this.fillStyle); fills.push([arcs.at(-1)[0], arcs.at(-1)[1], this.fillStyle]); }
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

test("renders an accretion disk around a dark event horizon and pauses offscreen", () => {
  const page = mount();
  assert.ok(page.drawn() > 2400);
  assert.ok(["#ffe0a7", "#ffb376", "#a3bdf6", "#0a1020"].every(color => page.colors.has(color)));
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

test("mouse movement opens a local ripple that settles after leaving", () => {
  const page = mount();
  page.frame(100);
  assert.equal(page.strokes(), 1);
  page.pointer(260, 205);
  for (let i = 0; i < 15; i++) {
    page.frame(150 + i * 40);
  }
  assert.equal(page.strokes(), 3);

  page.leave();
  for (let i = 0; i < 60; i++) {
    page.frame(800 + i * 40);
  }
  assert.equal(page.strokes(), 1);
  assert.ok(page.colors.has("#0a1020"));
});

test("touch and reduced-motion users do not get a mouse ripple", () => {
  const page = mount({ reduced: true });
  page.pointer(260, 205);
  assert.equal(page.frames.size, 0);
  page.setTheme("light");
  assert.equal(page.strokes(), 1);

  const touch = mount();
  touch.pointer(260, 205, "touch");
  touch.frame(100);
  assert.equal(touch.strokes(), 1);
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
  assert.ok(mobile.colors.has("#bb6729"));
});
