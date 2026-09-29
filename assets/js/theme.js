(function () {
  var root = document.documentElement;
  var savedTheme = null;

  try {
    savedTheme = localStorage.getItem("theme");
  } catch (error) {
    savedTheme = null;
  }

  if (!savedTheme) {
    savedTheme = "dark";
  }
  root.setAttribute("data-theme", savedTheme);
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute("content", savedTheme === "light" ? "#f6f8fe" : "#0b1020");

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector("[data-theme-button]");
    if (!toggle) return;

    function sync(theme) {
      root.setAttribute("data-theme", theme);
      if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#f6f8fe" : "#0b1020");
      toggle.setAttribute("aria-checked", theme === "light" ? "true" : "false");
      window.dispatchEvent(new CustomEvent("site-theme-change", {
        detail: { theme: theme }
      }));
    }

    sync(root.getAttribute("data-theme") || "dark");

    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch (error) {
        // The visual theme still works when storage is unavailable.
      }
      sync(next);
    });
  });
})();
