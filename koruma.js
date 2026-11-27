/* Hisse-Tarayici — içerik kilidi (yumuşak katman)
 *
 * KURAL: ham veri (fiyat, bilanço, grafik, haber) herkese açık.
 *        Analiz katmanı (giriş skoru, dönüş sinyali, tez uyarıları, AL/İZLE etiketi,
 *        rejim skoru, genişlik, BIST kalite sonucu) üyelere özel.
 *
 * Kullanım: HTML'de <div class="ucretli" data-baslik="Giriş uygunluğu"> … </div>
 * Giriş yoksa içerik bulanıklaşır ve üstüne "Üyelere özel" kartı gelir.
 */
(function () {
  "use strict";

  var CSS = `
  .ucretli{position:relative}
  .ucretli.kilitli > *:not(.kilit-kart){filter:blur(7px);pointer-events:none;user-select:none}
  .ucretli .kilit-kart{display:none}
  .ucretli.kilitli .kilit-kart{display:flex}
  .kilit-kart{position:absolute;inset:0;align-items:center;justify-content:center;z-index:20;padding:14px}
  .kilit-ic{background:rgba(13,23,41,.96);border:1px solid #2f4a76;border-radius:14px;
    padding:16px 18px;max-width:420px;text-align:center;box-shadow:0 18px 40px -20px rgba(0,0,0,.9)}
  .kilit-ic .k-ust{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:#93c5fd;font-weight:700;margin-bottom:6px}
  .kilit-ic .k-ad{font-size:14.5px;font-weight:700;color:#e6edf7;margin-bottom:6px}
  .kilit-ic .k-ac{font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:12px}
  .kilit-ic a{display:inline-block;background:#1d4ed8;border:1px solid #2563eb;color:#fff;
    border-radius:9px;padding:9px 16px;font-size:12.5px;font-weight:700;text-decoration:none}
  .kilit-ic a:hover{background:#2563eb}
  .kilit-ic .k-alt{display:block;margin-top:8px;font-size:11px;color:#64748b}
  .kilit-ic .k-alt a{background:none;border:0;color:#38bdf8;padding:0;font-weight:600;font-size:11px}
  .uyelik-bulanik{transition:filter .15s}
  .uyelik-bulanik.bulanik{filter:blur(6px);pointer-events:none;user-select:none}
  .uyelik-rozet{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;
    letter-spacing:.4px;color:#93c5fd;border:1px solid #2f4a76;border-radius:99px;padding:2px 8px;
    vertical-align:middle;margin-left:6px}
  `;

  function stilEkle() {
    if (document.getElementById("kilit-stil")) return;
    var s = document.createElement("style");
    s.id = "kilit-stil";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function kart(ad) {
    return '<div class="kilit-kart"><div class="kilit-ic">' +
      '<div class="k-ust">🔒 Üyelere özel</div>' +
      '<div class="k-ad">' + (ad || "Analiz katmanı") + '</div>' +
      '<div class="k-ac">Ham veri herkese açık; bu bölümdeki analiz ve sinyaller üyelere özeldir. ' +
      'Beta süresince ücretsiz.</div>' +
      '<a href="giris.html">Giriş yap / ücretsiz kayıt ol</a>' +
      '<span class="k-alt">Hesabın yok mu? <a href="giris.html">30 saniyede aç</a></span>' +
      '</div></div>';
  }

  var SON_DURUM = null;

  function uygula(oturumVar) {
    SON_DURUM = oturumVar;
    document.body.classList.toggle("oturum-var", !!oturumVar);
    document.querySelectorAll(".ucretli").forEach(function (el) {
      if (!el.querySelector(".kilit-kart")) {
        el.insertAdjacentHTML("beforeend", kart(el.getAttribute("data-baslik")));
      }
      el.classList.toggle("kilitli", !oturumVar);
      el.classList.toggle("acik", !!oturumVar);
    });
    // hisse kimliği / etiket gibi analiz izlerini de buzla
    document.querySelectorAll(".uyelik-bulanik").forEach(function (el) {
      el.classList.toggle("bulanik", !oturumVar);
    });

    // ★ kısa liste filtresi: üye değilse kapat (seçimleri ele vermesin)
    kisaFiltreKoru(oturumVar);

    // rozet: analiz sütun başlıklarına küçük kilit işareti
    document.querySelectorAll("[data-uyelik-rozet]").forEach(function (el) {
      if (oturumVar) { el.innerHTML = el.innerHTML.replace(/<span class="uyelik-rozet">.*?<\/span>/, ""); return; }
      if (el.querySelector(".uyelik-rozet")) return;
      el.insertAdjacentHTML("beforeend", '<span class="uyelik-rozet">🔒</span>');
    });
  }

  function kisaFiltreKoru(oturumVar) {
    var btn = document.querySelector('.fbtn[data-f="KISA"]');
    if (!btn) return;
    if (oturumVar) { btn.classList.remove("ucretli-kilit"); btn.title = "Kısa liste"; return; }
    if (btn.dataset.kilitli === "1") return;
    btn.dataset.kilitli = "1";
    btn.classList.add("ucretli-kilit");
    btn.title = "Kısa liste üyelere özel";
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var m = document.getElementById("kilit-mesaj");
      if (!m) {
        m = document.createElement("div");
        m.id = "kilit-mesaj";
        m.style.cssText = "position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99;" +
          "background:#0d1729;border:1px solid #2f4a76;color:#dbe7f7;padding:12px 16px;border-radius:12px;" +
          "font-size:12.5px;box-shadow:0 16px 40px -20px #000;max-width:90vw";
        document.body.appendChild(m);
      }
      m.innerHTML = "🔒 <b>Kısa liste üyelere özel.</b> Ham veri herkese açık; analiz için " +
        '<a href="giris.html" style="color:#38bdf8">giriş yap</a> (beta ücretsiz).';
      clearTimeout(window.__kilitZaman);
      window.__kilitZaman = setTimeout(function () { m.remove(); }, 6000);
    }, true);
  }

  /* Paneller JS ile sonradan doluyor (innerHTML) -> kilit kartini yeniden koy */
  function gozle() {
    if (typeof MutationObserver === "undefined") return;
    var bekliyor = false;
    var goz = new MutationObserver(function () {
      if (bekliyor) return;
      bekliyor = true;
      setTimeout(function () {
        bekliyor = false;
        if (SON_DURUM !== null) uygula(SON_DURUM);
      }, 120);
    });
    goz.observe(document.body, {childList: true, subtree: true});
  }

  function baslat() {
    // CSS her zaman ekle: paneller JS ile sonradan olusabiliyor (.ucretli yoksa da gerekli)
    stilEkle();
    if (document.querySelector(".ucretli") || document.querySelector("[data-uyelik-rozet]")) {
      gozle();
      // once hemen kilitle (kullanici bulanik gormesin), sonra oturum varsa ac
      uygula(false);
      if (window.HT && window.HT.aktif && window.HT.oturum) {
        window.HT.oturum().then(function (s) { uygula(!!(s && s.email)); })
          .catch(function () { uygula(false); });
      }
    }
  }

  // Script bazen DOMContentLoaded'dan SONRA yukleniyor (ag yarisi) -> hazirsa hemen calis
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }
})();

