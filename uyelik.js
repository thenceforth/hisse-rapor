/* Hisse-Tarayici — üyelik (Supabase Auth, e-posta + parola)
 *
 * Kurulum: aşağıdaki iki değeri Supabase projenden al ve doldur.
 *   SUPABASE_URL : https://xxxx.supabase.co
 *   SUPABASE_KEY : "anon public" anahtarı (gizli anahtar DEĞİL)
 *
 * Boş bırakılırsa site "üyelik kapalı" modunda çalışır (form yerine kurulum notu).
 */
window.HT_UYELIK_AYAR = {
  SUPABASE_URL: "https://hcopdbjklpjjmbisbfnl.supabase.co",
  SUPABASE_KEY: "sb_publishable_yobS4-qxvXanxk_9V8ZGAQ_fCiRSRsQ",
  TABLO: "profiles",
  // Sosyal giriş: Supabase panelinde saglayici acildiktan sonra true yap
  GOOGLE_AKTIF: true,
  APPLE_AKTIF: false,  // Apple Developer Program (yillik 99 USD) gerektirir
  DONUS_SAYFASI: "hesap.html"
};

(function () {
  "use strict";

  var A = window.HT_UYELIK_AYAR || {};

  /* GUVENLIK: gizli (secret / service_role) anahtar ISTEMCIYE KONULAMAZ.
     Supabase'in yeni anahtar formati:
       sb_publishable_...  -> tarayicida kullanilir (dogru olan)
       sb_secret_...       -> SADECE sunucuda; sitede kullanilirsa tum veritabani acilir
     Eski format: "anon public" JWT kullanilir, "service_role" JWT kullanilmaz. */
  var ANAHTAR_HATASI = "";
  var K = String(A.SUPABASE_KEY || "");
  if (K.indexOf("sb_secret_") === 0) {
    ANAHTAR_HATASI = "Gizli anahtar (sb_secret_...) tarayıcıya konulamaz. " +
      "Supabase panelinden 'publishable' anahtarı kullan.";
  } else if (K && (K.split(".").length === 3)) {
    try {
      var govde = JSON.parse(atob(K.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (govde && govde.role === "service_role") {
        ANAHTAR_HATASI = "service_role anahtarı tarayıcıya konulamaz. 'anon public' kullan.";
      }
    } catch (e) {}
  }

  var EKSIK_URL = !!(A.SUPABASE_KEY && !A.SUPABASE_URL);
  var AKTIF = !!(A.SUPABASE_URL && A.SUPABASE_KEY) && !ANAHTAR_HATASI;
  window.HT_ANAHTAR_HATASI = ANAHTAR_HATASI;
  window.HT_EKSIK_URL = EKSIK_URL;
  var OTURUM_KEY = "ht_oturum";

  function api(yol, secenek) {
    var s = secenek || {};
    s.headers = Object.assign({
      "apikey": A.SUPABASE_KEY,
      "Content-Type": "application/json"
    }, s.headers || {});
    return fetch(A.SUPABASE_URL.replace(/\/$/, "") + yol, s);
  }

  function oturumOku() {
    try {
      var s = JSON.parse(localStorage.getItem(OTURUM_KEY) || "null");
      if (!s || !s.access_token) return null;
      return s;
    } catch (e) { return null; }
  }

  function oturumYaz(s) {
    localStorage.setItem(OTURUM_KEY, JSON.stringify(s));
  }

  function oturumSil() {
    localStorage.removeItem(OTURUM_KEY);
  }

  function suresiGecti(s) {
    if (!s || !s.expires_at) return true;
    return Date.now() > (s.expires_at - 30000);
  }

  function paketle(veri) {
    return {
      access_token: veri.access_token,
      refresh_token: veri.refresh_token,
      expires_at: Date.now() + (veri.expires_in || 3600) * 1000,
      email: (veri.user && veri.user.email) || null,
      id: (veri.user && veri.user.id) || null
    };
  }

  function yenile(s) {
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return api("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) {
      if (!r.ok) { oturumSil(); return null; }
      return r.json().then(function (j) {
        var yeni = paketle(j);
        oturumYaz(yeni);
        return yeni;
      });
    }).catch(function () { return null; });
  }

  /* ---- dışa açılan işlevler ---- */
  var HT = {
    aktif: AKTIF,

    kayit: function (eposta, parola) {
      if (!AKTIF) return Promise.reject(new Error("kapali"));
      return api("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({ email: eposta, password: parola })
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) {
            var m = (j && (j.msg || j.message || j.error_description)) || "Kayıt başarısız";
            throw new Error(m);
          }
          if (!j.access_token) {
            // e-posta doğrulaması açık: oturum yok, kullanıcıya haber ver
            return { dogrulamaGerekli: true, email: eposta };
          }
          var s = paketle(j);
          oturumYaz(s);
          return { oturum: s };
        });
      });
    },

    giris: function (eposta, parola) {
      if (!AKTIF) return Promise.reject(new Error("kapali"));
      return api("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email: eposta, password: parola })
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) {
            var m = (j && (j.error_description || j.msg || j.message)) || "Giriş başarısız";
            if (/invalid/i.test(m)) m = "E-posta veya parola hatalı.";
            throw new Error(m);
          }
          var s = paketle(j);
          oturumYaz(s);
          return s;
        });
      });
    },

    cikis: function () {
      var s = oturumOku();
      oturumSil();
      if (!AKTIF || !s) return Promise.resolve();
      return api("/auth/v1/logout", {
        method: "POST",
        headers: { "Authorization": "Bearer " + s.access_token }
      }).catch(function () {});
    },

    oturum: function () {
      if (!AKTIF) return Promise.resolve(null);
      var s = oturumOku();
      if (!s) return Promise.resolve(null);
      if (!suresiGecti(s)) {
        return HT.epostaTamamla ? HT.epostaTamamla(s) : Promise.resolve(s);
      }
      return yenile(s).then(function (y) {
        return y && HT.epostaTamamla ? HT.epostaTamamla(y) : y;
      });
    },

    sifreSifirla: function (eposta) {
      if (!AKTIF) return Promise.reject(new Error("kapali"));
      return api("/auth/v1/recover", {
        method: "POST",
        body: JSON.stringify({ email: eposta })
      }).then(function (r) {
        if (!r.ok) throw new Error("Sıfırlama e-postası gönderilemedi.");
        return true;
      });
    }
  };

  function donusAdresi() {
    var temel = location.href.split("#")[0].replace(/[^/]*$/, "");
    return temel + (A.DONUS_SAYFASI || "hesap.html");
  }

  HT.sosyal = function (saglayici) {
    if (!AKTIF) return false;
    var url = A.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/authorize?provider=" +
      encodeURIComponent(saglayici) + "&redirect_to=" + encodeURIComponent(donusAdresi());
    location.href = url;
    return true;
  };

  HT.girisGoogle = function () { return HT.sosyal("google"); };
  HT.girisApple = function () { return HT.sosyal("apple"); };

  /* OAuth donusu: #access_token=...&refresh_token=...&expires_in=... */
  HT.donusuYakala = function () {
    var h = location.hash || "";
    if (h.indexOf("access_token=") < 0) return false;
    var p = {};
    h.replace(/^#/, "").split("&").forEach(function (x) {
      var i = x.indexOf("=");
      if (i > 0) p[x.slice(0, i)] = decodeURIComponent(x.slice(i + 1));
    });
    if (!p.access_token) return false;
    var s = {
      access_token: p.access_token,
      refresh_token: p.refresh_token || null,
      expires_at: Date.now() + (parseInt(p.expires_in || "3600", 10) * 1000),
      email: null, id: null
    };
    oturumYaz(s);
    history.replaceState(null, "", location.pathname + location.search);
    return s;
  };

  // oturumda e-posta yoksa (OAuth) /auth/v1/user ile tamamla
  HT.epostaTamamla = function (s) {
    if (!s || s.email || !s.access_token) return Promise.resolve(s);
    return api("/auth/v1/user", { headers: { "Authorization": "Bearer " + s.access_token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (u) {
        if (u && u.email) { s.email = u.email; s.id = u.id; oturumYaz(s); }
        return s;
      }).catch(function () { return s; });
  };

  /* --- Sifresiz giris: e-posta tek kullanimlik kod (OTP) --- */
  HT.kodGonder = function (eposta) {
    if (!AKTIF) return Promise.reject(new Error("kapali"));
    return api("/auth/v1/otp", {
      method: "POST",
      body: JSON.stringify({ email: eposta, create_user: true })
    }).then(function (r) {
      if (!r.ok) {
        return r.json().then(function (j) {
          var m = (j && (j.msg || j.message || j.error_description)) || "Kod gönderilemedi";
          if (/rate|too many/i.test(m)) m = "Çok fazla istek. Birkaç dakika sonra dene.";
          throw new Error(m);
        });
      }
      return true;
    });
  };

  HT.kodDogrula = function (eposta, kod) {
    if (!AKTIF) return Promise.reject(new Error("kapali"));
    return api("/auth/v1/verify", {
      method: "POST",
      body: JSON.stringify({ type: "email", email: eposta, token: String(kod).trim() })
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.access_token) {
          var m = (j && (j.msg || j.error_description || j.message)) || "Kod geçersiz";
          if (/expired|invalid/i.test(m)) m = "Kod geçersiz veya süresi dolmuş.";
          throw new Error(m);
        }
        var ot = paketle(j);
        oturumYaz(ot);
        return ot;
      });
    });
  };

  window.HT = HT;

  /* ---- hosgeldin bildirimi (kayit sonrasi) ---- */
  function hosgeldin(eposta) {
    if (!/hosgeldin=1/.test(location.search)) return;
    var k = document.createElement("div");
    k.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:999;" +
      "background:#0d1729;border:1px solid #1f6f4a;color:#d1fae5;padding:12px 18px;border-radius:12px;" +
      "font-size:13px;box-shadow:0 18px 44px -22px #000;max-width:92vw;text-align:center";
    k.innerHTML = "✅ <b>Hoş geldin!</b> " + (eposta ? eposta.replace(/</g,"&lt;") + " · " : "") +
      "Beta üyeliğin açık. Analizler artık görünür.";
    document.body.appendChild(k);
    setTimeout(function () { k.remove(); }, 6000);
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }

  /* ---- üst menüde durum ---- */
  document.addEventListener("DOMContentLoaded", function () {
    var kap = document.getElementById("uyelikDurum");
    if (!kap) return;
    if (!AKTIF) {
      kap.innerHTML = '<a href="giris.html" title="' +
        (window.HT_ANAHTAR_HATASI ? "Üyelik yapılandırma hatası" : "Üyelik kurulumu bekliyor") +
        '">👤 Giriş</a>';
      return;
    }
    HT.oturum().then(function (s) {
      if (s && s.email) {
        hosgeldin(s.email);
        kap.innerHTML = '<a href="hesap.html" title="Hesabım">👤 ' +
          s.email.replace(/</g, "&lt;") + '</a>';
      } else {
        kap.innerHTML = '<a href="giris.html">👤 Giriş</a>';
      }
    });
  });
})();
