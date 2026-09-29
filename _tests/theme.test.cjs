const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const test = require("node:test");

const script = readFileSync(join(__dirname, "../assets/js/theme.js"), "utf8");

function mount(saved = "dark", systemLight = false) {
  const attributes = {};
  const events = [];
  const storage = { theme: saved };
  let onReady;
  let onSystemChange;
  const buttons = ["dark", "system", "light"].map(mode => ({
    mode,
    attributes: { "data-theme-option": mode },
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { this.click = listener; }
  }));
  const meta = { setAttribute(name, value) { this.content = value; } };
  const media = { matches: systemLight, addEventListener(name, listener) { onSystemChange = listener; } };
  const document = {
    documentElement: { setAttribute(name, value) { attributes[name] = value; } },
    querySelector() { return meta; },
    querySelectorAll() { return buttons; },
    addEventListener(name, listener) { onReady = listener; }
  };
  const window = {
    matchMedia() { return media; },
    dispatchEvent(event) { events.push(event.detail.theme); }
  };
  const localStorage = {
    getItem(name) { return storage[name]; },
    setItem(name, value) { storage[name] = value; }
  };
  class CustomEvent { constructor(type, options) { this.detail = options.detail; } }

  runInNewContext(script, { document, window, localStorage, CustomEvent });
  onReady();
  return { attributes, buttons, events, meta, media, storage, systemChange(value) { media.matches = value; onSystemChange(); } };
}

test("theme picker persists the selected mode and exposes exactly one pressed option", () => {
  const site = mount();
  assert.equal(site.attributes["data-theme"], "dark");
  site.buttons[2].click();
  assert.equal(site.attributes["data-theme"], "light");
  assert.equal(site.storage.theme, "light");
  assert.deepEqual(site.buttons.map(button => button.attributes["aria-pressed"]), ["false", "false", "true"]);
  assert.equal(site.meta.content, "#f6f8fe");
});

test("system mode follows OS changes without overriding explicit dark mode", () => {
  const site = mount("system", false);
  assert.equal(site.attributes["data-theme-mode"], "system");
  assert.equal(site.attributes["data-theme"], "dark");
  site.systemChange(true);
  assert.equal(site.attributes["data-theme"], "light");
  assert.equal(site.buttons[1].attributes["aria-pressed"], "true");
  site.buttons[0].click();
  site.systemChange(false);
  site.systemChange(true);
  assert.equal(site.attributes["data-theme"], "dark");
});
