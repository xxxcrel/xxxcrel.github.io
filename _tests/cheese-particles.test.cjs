const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const test = require("node:test");

const script = readFileSync(join(__dirname, "../assets/js/cheese-particles.js"), "utf8");

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

  const context = {
    clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, setTransform() {}, beginPath() {}, arc() {},
    fill() { drawn++; colors.add(this.fillStyle); }
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
    drawn() { return drawn; },
    resize() { onResize(); },
    inView(value) { observer([{ isIntersecting: value }]); },
    setTheme(value) { theme = value; events["window:site-theme-change"](); },
    setReduced(value) { motion.matches = value; onMotionChange(); }
  };
}

test("renders a particle cheese and pauses when it leaves the viewport", () => {
  const page = mount();
  assert.ok(page.drawn() > 1500);
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
  assert.ok(mobile.colors.has("#a9600e"));
});
