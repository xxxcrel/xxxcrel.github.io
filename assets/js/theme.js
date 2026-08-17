(function () {
  var root = document.documentElement;
  var savedTheme = null;

  try {
    savedTheme = localStorage.getItem("theme");
  } catch (error) {
    savedTheme = null;
  }

  root.setAttribute("data-theme", savedTheme || "dark");

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;

    function sync(theme) {
      root.setAttribute("data-theme", theme);
      toggle.checked = theme === "dark";
      window.dispatchEvent(new CustomEvent("site-theme-change", {
        detail: { theme: theme }
      }));
    }

    sync(root.getAttribute("data-theme") || "dark");

    toggle.addEventListener("change", function () {
      var next = toggle.checked ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch (error) {
        // The visual theme still works when storage is unavailable.
      }
      sync(next);
    });
  });
})();
