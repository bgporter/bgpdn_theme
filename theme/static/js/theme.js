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
     Pelican renders a captioned image as
       <p class="img-caption"><img …><br>caption text</p>
     (the caption is bare text after the <br>, not wrapped in anything),
     and sometimes <p><img …><em>caption</em></p> or <img title="caption">.
     A bare <p> like that reads as stray text, so normalize all of these to
     a real <figure><figcaption> (centered, muted, divider rule). */
  function figurify() {
    var content = document.querySelector(".content");
    if (!content) return;
    var paras = Array.prototype.slice.call(content.querySelectorAll(":scope > p"));
    paras.forEach(function (p) {
      var img = p.querySelector(":scope > img, :scope > a > img");
      if (!img) return;
      // the moveable block: the <img>, or its wrapping <a> if it's linked
      var imgBlock = (img.parentElement === p) ? img : img.parentElement;

      var kids = Array.prototype.slice.call(p.childNodes);

      // bail on inline images sitting mid-sentence (real content precedes the image)
      var before = "";
      for (var i = 0; i < kids.length && kids[i] !== imgBlock; i++) before += kids[i].textContent || "";
      if (before.trim() !== "") return;

      var marked = p.classList.contains("img-caption");

      // caption = everything after the image, minus one separating <br> + leading space
      var fc = document.createElement("figcaption");
      var hasCaption = false, seen = false, skippedBr = false;
      kids.forEach(function (node) {
        if (node === imgBlock) { seen = true; return; }
        if (!seen) return;
        if (!skippedBr && node.nodeName === "BR") { skippedBr = true; return; }
        if (node.nodeType === 3 && !node.textContent.trim() && !hasCaption) return;
        fc.appendChild(node.cloneNode(true));
        if (node.nodeType === 1 || (node.textContent && node.textContent.trim())) hasCaption = true;
      });

      // only trust trailing text as a caption when the paragraph is marked or it's emphasized
      if (hasCaption && !marked && !fc.querySelector("em, i, b, strong, code")) hasCaption = false;

      // title-attribute caption
      if (!hasCaption && img.getAttribute("title")) {
        fc.textContent = img.getAttribute("title");
        img.removeAttribute("title");
        hasCaption = true;
      }

      // if there's leftover text we won't show as a caption, leave the paragraph alone
      if (!hasCaption && !marked && (p.textContent || "").trim() !== "") return;

      var fig = document.createElement("figure");
      fig.appendChild(imgBlock); // moves the node (keeps attrs/listeners)
      if (hasCaption) fig.appendChild(fc);
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
