const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const test = require("node:test");

const script = readFileSync(join(__dirname, "../assets/js/ambient-grid.js"), "utf8");

function mount({ reduced = false, hover = true, home = true } = {}) {
  let points = [];
  let strokes = 0;
  let curves = 0;
  let nextFrame = 0;
  let theme = "dark";
  const events = {};
  const frames = new Map();
  const context = {
    clearRect() { points = []; strokes = 0; curves = 0; },
    setTransform() {}, beginPath() {},
    moveTo(x, y) { points.push([x, y]); },
    quadraticCurveTo(cx, cy, x, y) { points.push([x, y]); curves++; },
    lineTo(x, y) { points.push([x, y]); },
    stroke() { strokes++; }
  };
  const canvas = { style: {}, getContext() { return context; } };
  const media = (matches) => ({ matches, addEventListener() {} });
  const document = {
    hidden: false,
    documentElement: { getAttribute() { return theme; } },
    querySelector(selector) { return selector === "[data-ambient-grid]" ? canvas : home ? {} : null; },
    addEventListener(name, handler) { events[`document:${name}`] = handler; }
  };
  const window = {
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 2,
    matchMedia(query) { return query.includes("reduced-motion") ? media(reduced) : media(hover); },
    requestAnimationFrame(callback) { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener(name, handler) { events[name] = handler; }
  };

  runInNewContext(script, { document, window });
  return {
    canvas, context, events, frames, document,
    points() { return points; }, strokes() { return strokes; }, curves() { return curves; },
    frame(time) {
      const next = frames.entries().next().value;
      if (!next) return;
      frames.delete(next[0]);
      next[1](time);
    },
    setTheme(value) { theme = value; events["site-theme-change"](); }
  };
}

test("the full-viewport grid bends near the pointer and stays behind content", () => {
  const grid = mount();
  assert.equal(grid.canvas.style.position, "fixed");
  assert.equal(grid.canvas.style.pointerEvents, "none");
  assert.equal(grid.canvas.width, 1920);
  assert.ok(grid.strokes() > 20);
  assert.ok(grid.curves() > grid.strokes() * 10);
  assert.equal(grid.context.lineCap, "round");
  assert.equal(grid.frames.size, 1);

  grid.frame(100);
  const original = grid.points();
  grid.events.pointermove({ pointerType: "mouse", clientX: 640, clientY: 400 });
  for (let i = 0; i < 18; i++) grid.frame(150 + i * 50);
  const bent = grid.points();
  assert.equal(bent.length, original.length);
  assert.ok(bent.some((point, index) => Math.hypot(point[0] - original[index][0], point[1] - original[index][1]) > 8));

  grid.events.pointerout({ relatedTarget: null });
  for (let i = 0; i < 60; i++) grid.frame(1100 + i * 50);
  assert.ok(grid.points().every((point, index) => Math.hypot(point[0] - original[index][0], point[1] - original[index][1]) < 3));
});

test("reduced-motion and coarse-pointer devices see a static, theme-aware grid", () => {
  for (const options of [{ reduced: true }, { hover: false }]) {
    const grid = mount(options);
    assert.equal(grid.frames.size, 0);
    const still = grid.points();
    grid.events.pointermove({ pointerType: "touch", clientX: 640, clientY: 400 });
    grid.setTheme("light");
    assert.equal(grid.context.strokeStyle, "rgba(65, 91, 142, .09)");
    assert.deepEqual(grid.points(), still);
  }
});

test("article pages use a quieter grid under the text", () => {
  const grid = mount({ home: false, reduced: true });
  assert.equal(grid.context.strokeStyle, "rgba(150, 181, 243, .045)");
  grid.setTheme("light");
  assert.equal(grid.context.strokeStyle, "rgba(65, 91, 142, .055)");
});
