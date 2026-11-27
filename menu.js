/* Uzun Vade — üst menü davranışı (mobil çekmece, kaydırma gölgesi, klavye) */
(function () {
  "use strict";
  var nav = document.querySelector(".uv-nav");
  if (!nav) return;

  var buton = nav.querySelector(".uv-ac");
  var menu = nav.querySelector(".uv-menu");

  function acikMi() { return nav.classList.contains("uv-nav-acik"); }
  function kapat() {
    nav.classList.remove("uv-nav-acik");
    document.body.classList.remove("uv-kilit");
    if (buton) buton.setAttribute("aria-expanded", "false");
  }
  function ac() {
    nav.classList.add("uv-nav-acik");
    document.body.classList.add("uv-kilit");
    if (buton) buton.setAttribute("aria-expanded", "true");
  }

  // "Araçlar" açılır menüsü
  var alt = nav.querySelector(".uv-alt");
  var altBtn = alt && alt.querySelector(".uv-alt-btn");
  var altMenu = alt && alt.querySelector(".uv-alt-menu");
  function altKapat() {
    if (!alt) return;
    alt.classList.remove("uv-alt-acik");
    if (altBtn) altBtn.setAttribute("aria-expanded", "false");
  }
  if (altBtn && altMenu) {
    altBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var acik = alt.classList.toggle("uv-alt-acik");
      altBtn.setAttribute("aria-expanded", acik ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (alt.classList.contains("uv-alt-acik") && !alt.contains(e.target)) altKapat();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && alt.classList.contains("uv-alt-acik")) altKapat();
    });
    altMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) altKapat();
    });
  }

  if (buton) {
    buton.addEventListener("click", function () {
      if (acikMi()) kapat(); else ac();
    });
  }
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") && acikMi()) kapat();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && acikMi()) kapat();
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 980 && acikMi()) kapat();
  });

  var sonDurum = null;
  function kaydirma() {
    var d = window.scrollY > 6;
    if (d !== sonDurum) {
      sonDurum = d;
      nav.classList.toggle("uv-kaydi", d);
    }
  }
  window.addEventListener("scroll", kaydirma, { passive: true });
  kaydirma();

  // aktif bağlantıyı vurgula (sunucu tarafı işaretleme yoksa)
  if (!nav.querySelector('.uv-menu a[aria-current="page"]')) {
    var dosya = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var esle = { "": "index.html", "index.html": "index.html", "bist.html": "bist.html",
      "endeks.html": "endeks.html", "temettu.html": "temettu.html", "etf.html": "etf.html",
      "performans.html": "performans.html", "hafta.html": "performans.html",
      "podcast.html": "podcast.html", "sozluk.html": "sozluk.html",
      "metodoloji.html": "metodoloji.html", "hakkinda.html": "hakkinda.html" };
    var hedef = esle[dosya];
    if (hedef) {
      var a = nav.querySelector('.uv-menu a[href="' + hedef + '"]');
      if (a) a.setAttribute("aria-current", "page");
    }
  }
})();
