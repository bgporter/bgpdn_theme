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

  /* ---------- image captions: promote to <figure><figcaption> ----------
     Pelican's Markdown renders a captioned image as either
       <p><img …><br><em>caption</em></p>      (no blank line), or
       <p><img …></p><p><em>caption</em></p>   (blank line between),
     or a bare <img title="caption">. None of these read as a caption —
     they look like stray italic text. Normalize them to a real figure so
     the caption is styled (centered, muted, with a divider rule). */
  function figurify() {
    var content = document.querySelector(".content");
    if (!content) return;
    var paras = Array.prototype.slice.call(content.querySelectorAll(":scope > p"));
    paras.forEach(function (p) {
      var img = p.querySelector(":scope > img");
      if (!img) return;

      // bail if this is an inline image inside a sentence (text besides a caption)
      var em = p.querySelector(":scope > em:last-child");
      var residual = (p.textContent || "").replace(em ? em.textContent : "", "").trim();
      if (residual !== "") return;

      var captionHTML = null;
      if (em) {
        // pattern A: caption shares the image's paragraph
        captionHTML = em.innerHTML;
      } else {
        // pattern B: next paragraph is italic-only
        var next = p.nextElementSibling;
        if (next && next.tagName === "P") {
          var nem = next.querySelector(":scope > em");
          if (nem && next.textContent.trim() === nem.textContent.trim()) {
            captionHTML = nem.innerHTML;
            next.remove();
          }
        }
        // pattern C: title attribute
        if (!captionHTML && img.getAttribute("title")) {
          captionHTML = img.getAttribute("title");
          img.removeAttribute("title");
        }
      }

      var fig = document.createElement("figure");
      fig.appendChild(img); // moves the node, preserving its attributes
      if (captionHTML) {
        var fc = document.createElement("figcaption");
        fc.innerHTML = captionHTML;
        fig.appendChild(fc);
      }
      p.replaceWith(fig);
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(enhanceCode);
  ready(wrapTables);
  ready(figurify);
})();
