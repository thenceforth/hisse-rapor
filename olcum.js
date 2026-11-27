/* Hisse-Tarayici — olcum + bekleme listesi (Supabase tabanli, dis hesap gerekmez)
 *
 * olaylar  : sayfa goruntuleme, tiklamalar (anonim; e-posta yok)
 * bekleme  : erken erisim e-posta listesi
 *
 * Gizlilik: cerez yok, IP saklanmaz. Oturum varsa sadece "uye" bayragi true olur.
 */
window.HT_AYAR = {
  SUPABASE_URL: "https://hcopdbjklpjjmbisbfnl.supabase.co",
  SUPABASE_KEY: "sb_publishable_yobS4-qxvXanxk_9V8ZGAQ_fCiRSRsQ",
  OLCUM_AKTIF: true,
  WAITLIST_AKTIF: true,
  ILETISIM: "mehmetalper77@gmail.com"
};

(function () {
  "use strict";
  var A = window.HT_AYAR || {};

  function bas(lar) {
    return Object.assign({
      "apikey": A.SUPABASE_KEY,
      "Authorization": "Bearer " + A.SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    }, lar || {});
  }

  function uyeMi() {
    try {
      var s = JSON.parse(localStorage.getItem("ht_oturum") || "null");
      return !!(s && s.access_token);
    } catch (e) { return false; }
  }

  function olay(ad, veri) {
    if (!A.OLCUM_AKTIF) return;
    try {
      fetch(A.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/olaylar", {
        method: "POST",
        headers: bas(),
        body: JSON.stringify({
          ad: String(ad).slice(0, 60),
          sayfa: location.pathname.split("/").pop() || "index.html",
          veri: veri || {},
          uye: uyeMi()
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }
  window.htOlay = olay;

  var sayfa = location.pathname.split("/").pop() || "index.html";
  var ticker = new URLSearchParams(location.search).get("t");
  if (ticker) sayfa = "hisse";
  olay("pageview", { sayfa: sayfa, t: ticker || null });

  document.addEventListener("DOMContentLoaded", function () {
    // --- bekleme listesi ---
    var form = document.getElementById("waitlistForm");
    if (form) {
      var mesaj = document.getElementById("waitlistMesaj");
      var yaz = function (t, renk) {
        if (!mesaj) return;
        mesaj.textContent = t;
        mesaj.style.color = renk || "#94a3b8";
      };
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var eposta = (form.querySelector('input[type="email"]').value || "").trim().toLowerCase();
        if (!eposta || eposta.indexOf("@") < 1) { yaz("Geçerli bir e-posta yaz.", "#fca5a5"); return; }
        yaz("Kaydediliyor…");
        fetch(A.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/bekleme", {
          method: "POST",
          headers: bas({ "Prefer": "return=minimal" }),
          body: JSON.stringify({ email: eposta, kaynak: sayfa })
        }).then(function (r) {
          if (r.ok || r.status === 409) {
            yaz("Listeye eklendin. Erken erişim açılınca yazacağım.", "#34d399");
            form.reset();
            olay("waitlist_kayit", {});
          } else {
            yaz("Kaydedilemedi, sonra tekrar dene.", "#fca5a5");
          }
        }).catch(function () { yaz("Bağlantı kurulamadı.", "#fca5a5"); });
      });
    }

    // --- disa baglanti tiklamalari (kaynak olcumu) ---
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (h.indexOf("hisse.html?t=") === 0) olay("hisse_tikla", { t: h.split("t=")[1].split("&")[0] });
      else if (h.indexOf("http") === 0 && a.target === "_blank") olay("disa_link", {});
    });
  });
})();

