(function () {
  "use strict";

  if (window.matchMedia && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll(".post-item").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      var bounds = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", event.clientX - bounds.left + "px");
      card.style.setProperty("--spot-y", event.clientY - bounds.top + "px");
    });
  });
})();
