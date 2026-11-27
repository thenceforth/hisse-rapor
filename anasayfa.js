/* Hisse-Tarayici — ana sayfa (ev) butonu
 * Her sayfanin sol alt kosesinde, temaya uyumlu cam efektli yuvarlak buton.
 * Ana sayfada gizlenir.
 */
(function () {
  "use strict";

  function sayfaAnaMi() {
    var p = location.pathname;
    return p === "/" || p === "" || /(\/|^)index\.html?$/.test(p) || /\/$/.test(p);
  }

  function yap() {
    if (document.getElementById("ht-ev")) return;
    if (sayfaAnaMi()) return;

    var a = document.createElement("a");
    a.id = "ht-ev";
    a.href = "index.html";
    a.title = "Ana sayfa";
    a.setAttribute("aria-label", "Ana sayfa");
    a.innerHTML =
      '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3.2 10.6 12 3.8l8.8 6.8"/><path d="M5.6 9.4V19a1.2 1.2 0 0 0 1.2 1.2h3.4v-5.1h3.6v5.1h3.4A1.2 1.2 0 0 0 18.4 19V9.4"/></svg>';

    a.style.cssText =
      "position:fixed;left:14px;bottom:14px;z-index:9998;width:46px;height:46px;display:flex;" +
      "align-items:center;justify-content:center;border-radius:14px;color:#cbd5e1;" +
      "background:linear-gradient(180deg,rgba(17,28,48,.94),rgba(9,15,27,.94));" +
      "border:1px solid #1e2c47;box-shadow:0 10px 26px -14px #000,inset 0 1px 0 rgba(255,255,255,.05);" +
      "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);text-decoration:none;" +
      "transition:transform .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease";

    a.addEventListener("mouseenter", function () {
      a.style.transform = "translateY(-2px)";
      a.style.borderColor = "#2f4a76";
      a.style.color = "#93c5fd";
      a.style.boxShadow = "0 14px 30px -14px #000,0 0 0 1px rgba(56,189,248,.25)";
    });
    a.addEventListener("mouseleave", function () {
      a.style.transform = "none";
      a.style.borderColor = "#1e2c47";
      a.style.color = "#cbd5e1";
      a.style.boxShadow = "0 10px 26px -14px #000,inset 0 1px 0 rgba(255,255,255,.05)";
    });
    a.addEventListener("focus", function () {
      a.style.outline = "2px solid #38bdf8";
      a.style.outlineOffset = "2px";
    });
    a.addEventListener("blur", function () {
      a.style.outline = "none";
    });

    document.body.appendChild(a);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", yap);
  } else {
    yap();
  }
})();
