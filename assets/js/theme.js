(function () {
  var root = document.documentElement;
  var mode = null;
  var systemPreference = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");

  try {
    mode = localStorage.getItem("theme");
  } catch (error) {
    mode = null;
  }

  if (mode !== "light" && mode !== "system") mode = "dark";
  var themeColor = document.querySelector('meta[name="theme-color"]');

  function effectiveTheme() {
    return mode === "system" ? (systemPreference && systemPreference.matches ? "light" : "dark") : mode;
  }

  function sync() {
    var theme = effectiveTheme();
    root.setAttribute("data-theme-mode", mode);
    root.setAttribute("data-theme", theme);
    if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#f6f8fe" : "#0b1020");
    document.querySelectorAll("[data-theme-option]").forEach(function (option) {
      option.setAttribute("aria-pressed", option.getAttribute("data-theme-option") === mode ? "true" : "false");
    });
    window.dispatchEvent(new CustomEvent("site-theme-change", { detail: { theme: theme } }));
  }

  root.setAttribute("data-theme-mode", mode);
  root.setAttribute("data-theme", effectiveTheme());
  if (themeColor) themeColor.setAttribute("content", effectiveTheme() === "light" ? "#f6f8fe" : "#0b1020");

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-theme-option]").forEach(function (option) {
      option.addEventListener("click", function () {
        mode = option.getAttribute("data-theme-option");
        try {
          localStorage.setItem("theme", mode);
        } catch (error) {
          // The visual theme still works when storage is unavailable.
        }
        sync();
      });
    });
    sync();

    if (systemPreference) {
      var followSystem = function () { if (mode === "system") sync(); };
      if (systemPreference.addEventListener) systemPreference.addEventListener("change", followSystem);
      else systemPreference.addListener(followSystem);
    }
  });
})();
