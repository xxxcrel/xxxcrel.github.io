(function () {
  "use strict";

  var header = document.querySelector("[data-site-header]");
  var slot = document.querySelector("[data-header-slot]");
  if (!header || !slot) return;

  var naturalHeight = 0;
  var scheduled = false;

  function sync() {
    header.classList.toggle("is-scrolled", window.scrollY > naturalHeight + 8);
  }

  function measure() {
    header.classList.remove("is-scrolled");
    slot.style.minHeight = "";
    naturalHeight = header.getBoundingClientRect().height;
    slot.style.minHeight = naturalHeight + "px";
    sync();
  }

  window.addEventListener("scroll", function () {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      sync();
    });
  }, { passive: true });
  window.addEventListener("resize", measure);
  measure();
})();
