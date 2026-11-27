/* Hisse-Tarayici — yonetici cubugu (yalniz admin hesabinda gorunur)
 * admin_mi() RPC ile sunucu tarafinda dogrulanir.
 */
(function () {
  "use strict";
  var A = window.HT_AYAR || {};
  if (!A.SUPABASE_URL || !A.SUPABASE_KEY) return;

  function oturum() {
    try { return JSON.parse(localStorage.getItem("ht_oturum") || "null"); } catch (e) { return null; }
  }

  var LINKLER = [
    ["⚙️ Admin paneli", "admin.html", "Üye istatistikleri, gelir, bekleme listesi"],
    ["👥 Üyeler", "https://supabase.com/dashboard/project/hcopdbjklpjjmbisbfnl/auth/users", "Supabase kullanıcı listesi"],
    ["📊 Analiz tablosu", "https://supabase.com/dashboard/project/hcopdbjklpjjmbisbfnl/editor", "public.analiz"],
    ["📥 Analiz yükle", "#", "PC'de: python analiz_yukle.py"],
    ["🎧 Podcast RSS", "podcast.xml", "Spotify/Apple beslemesi"],
    ["🗺️ Sitemap", "sitemap.xml", "SEO haritası"],
    ["💻 Kod", "https://github.com/thenceforth/Hisse-Tarayici", "GitHub deposu"],
    ["▶️ Actions", "https://github.com/thenceforth/Hisse-Tarayici/actions", "Otomatik işler"]
  ];

  function ciz(eposta) {
    if (document.getElementById("yoneticiBar")) return;
    var bar = document.createElement("div");
    bar.id = "yoneticiBar";
    bar.style.cssText = "margin:0 0 16px;padding:11px 14px;border:1px solid #2f4a76;border-radius:12px;" +
      "background:linear-gradient(180deg,rgba(29,78,216,.14),rgba(13,23,41,.9));display:flex;flex-wrap:wrap;" +
      "gap:8px 14px;align-items:center;font-size:12px";
    var baslik = '<span style="font-weight:700;color:#93c5fd;letter-spacing:.4px">YÖNETİCİ</span>' +
      '<span style="color:#64748b">' + (eposta || "") + '</span>';
    var linkler = LINKLER.map(function (x) {
      return '<a href="' + x[1] + '" title="' + x[2] + '"' +
        (x[1].indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "") +
        ' style="color:#cbd5e1;text-decoration:none;padding:4px 9px;border:1px solid #1e2c47;border-radius:8px">' +
        x[0] + '</a>';
    }).join("");
    bar.innerHTML = baslik + '<span style="flex:1"></span>' + linkler;
    var wrap = document.querySelector(".wrap") || document.body;
    var hedef = document.querySelector("h1");
    if (hedef && hedef.parentElement) hedef.parentElement.insertBefore(bar, hedef);
    else wrap.insertBefore(bar, wrap.firstChild);
  }

  function dene() {
    var s = oturum();
    if (!s || !s.access_token) return;
    fetch(A.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/rpc/admin_mi", {
      method: "POST",
      headers: {
        "apikey": A.SUPABASE_KEY,
        "Authorization": "Bearer " + s.access_token,
        "Content-Type": "application/json"
      },
      body: "{}"
    }).then(function (r) { return r.ok ? r.json() : false; })
      .then(function (admin) { if (admin === true) ciz(s.email); })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dene);
  } else {
    dene();
  }

  // oturum sonradan gelirse (giris sonrasi ayni sayfa) tekrar dene
  window.addEventListener("storage", function (e) { if (e.key === "ht_oturum") dene(); });
  setTimeout(dene, 2500);
})();
