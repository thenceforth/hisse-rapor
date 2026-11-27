/* Hisse-Tarayici — otomatik sayfa yenileme (varsayilan 60 sn)
 *
 * Akilli davranis:
 *  - Sekme arka plandaysa yenilemez
 *  - Form alanina yaziyorsan / bir sey seciliyse yenilemez
 *  - Kaydirma konumunu ve #bolum konumunu korur
 *  - Sag altta geri sayim; tiklayinca duraklat/devam
 *  - Test icin: ?hr=5 -> 5 saniyede bir
 */
(function () {
  "use strict";
  var VARSAYILAN = 60;
  var qs = new URLSearchParams(location.search);
  var SURE = Math.max(3, parseInt(qs.get("hr") || VARSAYILAN, 10) || VARSAYILAN);
  var ANAHTAR = "ht_yenile_duraklat";
  var duraklatildi = false;
  try { duraklatildi = sessionStorage.getItem(ANAHTAR) === "1"; } catch (e) {}

  var kalan = SURE;

  function yaziyorMu() {
    var e = document.activeElement;
    if (!e) return false;
    var t = (e.tagName || "").toUpperCase();
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return true;
    if (e.isContentEditable) return true;
    if (document.getSelection && String(document.getSelection()).length > 0) return true;
    return false;
  }

  function konumKaydet() {
    try {
      sessionStorage.setItem("ht_scroll", String(window.scrollY || 0));
      sessionStorage.setItem("ht_hash", location.hash || "");
    } catch (e) {}
  }

  function konumGeri() {
    try {
      var hash = sessionStorage.getItem("ht_hash") || "";
      var y = parseInt(sessionStorage.getItem("ht_scroll") || "0", 10) || 0;
      if (hash && hash !== "#") {
        var hedef = document.querySelector(hash);
        if (hedef) { hedef.scrollIntoView(); return; }
      }
      if (y > 0) window.scrollTo(0, y);
    } catch (e) {}
  }

  function yenile() {
    if (document.hidden) return;
    if (duraklatildi) return;
    if (yaziyorMu()) return;
    konumKaydet();
    location.reload();
  }

  // --- rozet ---
  var rozet = null;
  function rozetYap() {
    rozet = document.createElement("div");
    rozet.id = "ht-yenile-rozet";
    rozet.title = "Sayfa otomatik yenileniyor — durdurmak için tıkla";
    rozet.style.cssText =
      "position:fixed;right:12px;bottom:12px;z-index:9999;display:flex;align-items:center;gap:7px;" +
      "background:rgba(13,23,41,.92);border:1px solid #1e2c47;color:#94a3b8;font:600 11px/1 " +
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:7px 10px;border-radius:999px;" +
      "cursor:pointer;user-select:none;backdrop-filter:blur(6px);opacity:.75;transition:opacity .2s";
    rozet.onmouseenter = function () { rozet.style.opacity = "1"; };
    rozet.onmouseleave = function () { rozet.style.opacity = ".75"; };
    rozet.onclick = function () {
      duraklatildi = !duraklatildi;
      try { sessionStorage.setItem(ANAHTAR, duraklatildi ? "1" : "0"); } catch (e) {}
      guncelle();
    };
    document.body.appendChild(rozet);
  }

  function guncelle() {
    if (!rozet) return;
    var renk = duraklatildi ? "#f59e0b" : "#34d399";
    var metin = duraklatildi ? "⏸ yenileme durdu" : "⟳ " + kalan + " sn";
    rozet.innerHTML =
      '<span style="width:7px;height:7px;border-radius:50%;background:' + renk +
      ';box-shadow:0 0 8px ' + renk + '"></span><span>' + metin + "</span>";
  }

  function dongu() {
    if (document.hidden) { kalan = SURE; guncelle(); return; }
    kalan -= 1;
    if (kalan <= 0) { kalan = SURE; yenile(); return; }
    guncelle();
  }

  function basla() {
    konumGeri();
    rozetYap();
    guncelle();
    setInterval(dongu, 1000);
    window.addEventListener("beforeunload", konumKaydet);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
