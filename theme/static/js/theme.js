/* ============================================================
   theme.js — bgporter.net Pelican theme
   - Light/dark: follows OS by default, manual toggle persists.
   - Code blocks: copy button + horizontal-overflow fade hint.
   No dependencies.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- theme (light / dark) ---------- */
  var root = document.documentElement;
  var STORE = "bgp-theme";

  function stored() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  function apply(mode) {
    // mode: "light" | "dark" | null (null = follow OS)
    if (mode === "light" || mode === "dark") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
  }
  function osDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function effective() {
    var s = stored();
    if (s === "light" || s === "dark") return s;
    return osDark() ? "dark" : "light";
  }

  // initial (also set inline in <head> to avoid flash — see base.html)
  apply(stored());

  function toggle() {
    var next = effective() === "dark" ? "light" : "dark";
    // if the chosen mode equals the OS default, clear override so it keeps following OS
    if ((next === "dark") === osDark()) {
      try { localStorage.removeItem(STORE); } catch (e) {}
      apply(null);
    } else {
      try { localStorage.setItem(STORE, next); } catch (e) {}
      apply(next);
    }
  }

  // react to OS changes when following OS
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!stored()) apply(null);
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".theme-toggle");
    if (btn) { e.preventDefault(); toggle(); }
  });

  /* ---------- code blocks: copy + overflow fade ---------- */
  function enhanceCode() {
    var blocks = document.querySelectorAll(".highlight, .codehilite");
    blocks.forEach(function (block) {
      var pre = block.querySelector("pre");
      if (!pre) return;

      // fade element
      if (!block.querySelector(".scroll-fade")) {
        var fade = document.createElement("span");
        fade.className = "scroll-fade";
        block.appendChild(fade);
      }
      function updateFade() {
        var overflow = pre.scrollWidth - pre.clientWidth > 2;
        block.classList.toggle("is-overflow", overflow);
        var atEnd = pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 2;
        block.classList.toggle("is-scrolled-end", overflow && atEnd);
      }
      pre.addEventListener("scroll", updateFade, { passive: true });
      window.addEventListener("resize", updateFade);
      updateFade();

      // copy button
      if (!block.querySelector(".code-copy")) {
        var btn = document.createElement("button");
        btn.className = "code-copy";
        btn.type = "button";
        btn.textContent = "copy";
        btn.setAttribute("aria-label", "Copy code to clipboard");
        btn.addEventListener("click", function () {
          var code = block.querySelector("code") || pre;
          var text = code.innerText.replace(/\n$/, "");
          var done = function () {
            btn.textContent = "copied"; btn.classList.add("copied");
            setTimeout(function () { btn.textContent = "copy"; btn.classList.remove("copied"); }, 1400);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {});
          } else {
            var ta = document.createElement("textarea");
            ta.value = text; document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); done(); } catch (e) {}
            document.body.removeChild(ta);
          }
        });
        block.appendChild(btn);
      }
    });
  }

  /* ---------- wide tables: wrap for horizontal scroll ---------- */
  function wrapTables() {
    var tables = document.querySelectorAll(".content table");
    tables.forEach(function (table) {
      var parent = table.parentNode;
      if (parent && parent.classList && parent.classList.contains("table-scroll")) return;
      if (table.closest(".highlighttable, .codehilitetable")) return; // skip code line-number tables
      var wrap = document.createElement("div");
      wrap.className = "table-scroll";
      parent.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ---------- changelog index: colorize +adds / -deletes ---------- */
  /* The generator already wraps counts as
     <span class="diff"><span class="diff-add">+1</span> <span class="diff-delete">-1</span></span>
     so this is pure CSS (see theme.css) — no JS needed. */

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(enhanceCode);
  ready(wrapTables);
})();
