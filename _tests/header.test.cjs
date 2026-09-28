const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const test = require("node:test");

const script = readFileSync(join(__dirname, "../assets/js/header.js"), "utf8");

test("scrolling moves the existing header into a floating bar without changing page height", () => {
  const classes = new Set();
  const events = {};
  const frames = [];
  const header = {
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
    },
    getBoundingClientRect() { return { height: classes.has("is-scrolled") ? 56 : 120 }; }
  };
  const slot = { style: {} };
  const document = {
    querySelector(selector) { return selector === "[data-site-header]" ? header : slot; }
  };
  const window = {
    scrollY: 0,
    addEventListener(name, callback) { events[name] = callback; },
    requestAnimationFrame(callback) { frames.push(callback); }
  };

  runInNewContext(script, { document, window });
  assert.equal(slot.style.minHeight, "120px");
  assert.equal(classes.has("is-scrolled"), false);

  window.scrollY = 200;
  events.scroll();
  events.scroll();
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(classes.has("is-scrolled"), true);
  assert.equal(slot.style.minHeight, "120px");

  events.resize();
  assert.equal(slot.style.minHeight, "120px");
  assert.equal(classes.has("is-scrolled"), true);

  window.scrollY = 0;
  events.scroll();
  frames.shift()();
  assert.equal(classes.has("is-scrolled"), false);
});
