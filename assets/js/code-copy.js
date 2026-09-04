(function () {
  "use strict";

  function copyText(text, button) {
    var done = function () {
      button.textContent = "COPIED";
      button.classList.add("is-copied");
      window.setTimeout(function () {
        button.textContent = "COPY";
        button.classList.remove("is-copied");
      }, 1600);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done);
      return;
    }

    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); done(); } catch (error) { button.textContent = "SELECT"; }
    document.body.removeChild(area);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".markdown-body .highlight").forEach(function (block) {
      var pre = block.querySelector("pre");
      if (!pre || block.previousElementSibling && block.previousElementSibling.classList.contains("code-toolbar")) return;
      var code = block.querySelector("code");
      var wrapper = block.closest(".highlighter-rouge");
      var className = (code ? code.className : "") + " " + (wrapper ? wrapper.className : "");
      var language = (className.match(/language-([\w-]+)/) || [])[1] || "TEXT";
      var toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";
      toolbar.innerHTML = "<span>" + language + "</span><button class=\"copy-code\" type=\"button\">COPY</button>";
      var button = toolbar.querySelector("button");
      button.addEventListener("click", function () { copyText(pre.innerText, button); });
      block.parentNode.insertBefore(toolbar, block);
    });
  });
})();
