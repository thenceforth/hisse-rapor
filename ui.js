/* Hisse-Tarayici — mobil alt menü + yüzen buton yerleşimi
 * Masaüstünde görünmez; 760px altında alt menü çıkar.
 */
(function () {
  "use strict";

  var YOL = location.pathname.split("/").pop() || "index.html";

  function ikon(ad) {
    var m = {
      ev: '<path d="M3.2 10.6 12 3.8l8.8 6.8"/><path d="M5.6 9.4V19a1.2 1.2 0 0 0 1.2 1.2h3.4v-5.1h3.6v5.1h3.4A1.2 1.2 0 0 0 18.4 19V9.4"/>',
      endeks: '<path d="M3 17l5-5 4 3 4-6 5 4"/><path d="M3 21h18"/>',
      bist: '<path d="M4 20V8"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
      podcast: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/>',
      hesap: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/>',
    };
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (m[ad] || m.ev) + "</svg>";
  }

  var OGE = [
    ["index.html", "ev", "Ana"],
    ["endeks.html", "endeks", "Endeks"],
    ["bist.html", "bist", "BIST"],
    ["podcast.html", "podcast", "Podcast"],
    ["hesap.html", "hesap", "Hesap"],
  ];

  function stil() {
    if (document.getElementById("ht-ui-stil")) return;
    var s = document.createElement("style");
    s.id = "ht-ui-stil";
    s.textContent = [
      "#ht-nav{display:none}",
      "@media (max-width:760px){",
      "  #ht-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:9997;",
      "    background:linear-gradient(180deg,rgba(11,18,31,.97),rgba(8,13,24,.99));",
      "    border-top:1px solid #1b2740;padding:7px 4px calc(7px + env(safe-area-inset-bottom));",
      "    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);",
      "    justify-content:space-around;align-items:center}",
      "  #ht-nav a{display:flex;flex-direction:column;align-items:center;gap:3px;color:#7d8ea8;",
      "    text-decoration:none;font-size:10.5px;font-weight:600;letter-spacing:.2px;padding:2px 0;flex:1}",
      "  #ht-nav a.on{color:#7dd3fc}",
      "  #ht-nav a:active{opacity:.7}",
      "  body{padding-bottom:74px!important}",
      "  #ht-ev{bottom:calc(70px + env(safe-area-inset-bottom))!important;width:42px!important;height:42px!important;",
      "    border-radius:12px!important;left:12px!important}",
      "  #ht-yenile-rozet{bottom:calc(70px + env(safe-area-inset-bottom))!important;right:10px!important}",
      "  #ht-yazi{display:none!important}",
      "}",
      "@media (min-width:761px){#ht-nav{display:none!important}}",
      "#ht-yazi{position:fixed;right:14px;bottom:46px;z-index:9996;display:flex;align-items:center;justify-content:center;",
      "  width:38px;height:32px;border-radius:10px;background:rgba(13,23,41,.9);border:1px solid #1e2c47;color:#94a3b8;",
      "  font:700 12.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;cursor:pointer;",
      "  backdrop-filter:blur(6px);user-select:none;opacity:.8;transition:opacity .2s,border-color .2s,color .2s}",
      "#ht-yazi:hover{opacity:1;border-color:#2f4a76;color:#93c5fd}",
    ].join("\n");
    document.head.appendChild(s);
  }

  function nav() {
    if (document.getElementById("ht-nav")) return;
    var d = document.createElement("nav");
    d.id = "ht-nav";
    d.setAttribute("aria-label", "Alt menü");
    d.innerHTML = OGE.map(function (o) {
      var on = (YOL === o[0]) ? " class=\"on\"" : "";
      return '<a href="' + o[0] + '"' + on + '>' + ikon(o[1]) + "<span>" + o[2] + "</span></a>";
    }).join("");
    document.body.appendChild(d);
  }

  /* --- yazi boyutu: %100 -> %110 -> %120 -> %100 --- */
  var BOYUTLAR = [100, 110, 120];
  var ANAHTAR = "ht_yazi_boyut";

  function boyutUygula(k) {
    var i = Math.max(0, Math.min(BOYUTLAR.length - 1, k));
    var oran = BOYUTLAR[i] / 100;
    try {
      document.documentElement.style.zoom = oran === 1 ? "" : String(oran);
      localStorage.setItem(ANAHTAR, String(i));
    } catch (e) {}
    var b = document.getElementById("ht-yazi");
    if (b) {
      b.textContent = "Aa";
      b.title = "Yazı boyutu: %" + BOYUTLAR[i] + " (tıkla: büyüt)";
      b.style.color = i === 0 ? "#94a3b8" : "#7dd3fc";
    }
  }

  function yaziDugmesi() {
    if (document.getElementById("ht-yazi")) return;
    var b = document.createElement("div");
    b.id = "ht-yazi";
    b.setAttribute("role", "button");
    b.setAttribute("tabindex", "0");
    b.textContent = "Aa";
    var idx = 0;
    try { idx = parseInt(localStorage.getItem(ANAHTAR) || "0", 10) || 0; } catch (e) {}
    b.onclick = function () {
      idx = (idx + 1) % BOYUTLAR.length;
      boyutUygula(idx);
    };
    b.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.onclick(); } };
    document.body.appendChild(b);
    boyutUygula(idx);
  }

  function swKaydet() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
    try {
      navigator.serviceWorker.register("sw.js?v=1", { scope: "./" }).catch(function () {});
    } catch (e) {}
  }

  function basla() {
    stil();
    nav();
    yaziDugmesi();
    swKaydet();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
