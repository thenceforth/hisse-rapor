/* Uzun Vade — tablo araçları (izleme listesi + BIST)
 * - sütun göster/gizle, sırala, kalıcı tercih
 * - yatay kaydırma çubuğu gizli, fareyle tutup sürükleyerek kaydırma
 * - tam ekran tablo
 */
(function () {
  "use strict";
  var tablo = document.getElementById("tbl");
  if (!tablo) return;

  var BIST = /bist\.html/i.test(location.pathname);
  var SAYFA = BIST ? "bist" : "index";
  var ANAHTAR = "uv_sutun_v1_" + SAYFA;

  var MOBIL = window.innerWidth <= 860;
  var VARSAYILAN_GORUNUR = MOBIL
    ? (BIST ? [1, 2, 5, 7, 11, 12, 15]
             : [1, 2, 5, 11, 12, 13])
    : (BIST ? [0, 1, 2, 3, 5, 6, 7, 11, 12, 13, 15, 16]
            : [0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 14]);

  var basliklar = [];
  var panel, buton, tamBtn, sayacEl, listeEl, govdeGozlemci, uygulaniyor = false, zaman = null;
  var kap, sar, surukluyor = false, surukleBasladi = false, baslaX = 0, baslaScroll = 0, tikEngelle = false;

  function metinTemiz(t) {
    return String(t || "").replace(/[🔒★☆]/g, "").replace(/\s+/g, " ").trim();
  }
  function basliklariAl() {
    var tr = tablo.querySelector("thead tr");
    if (!tr) return false;
    basliklar = Array.prototype.slice.call(tr.children);
    return basliklar.length > 0;
  }
  function varsayilanDurum() {
    return {
      sira: basliklar.map(function (_, i) { return i; }),
      gorunen: basliklar.map(function (_, i) { return VARSAYILAN_GORUNUR.indexOf(i) >= 0; })
    };
  }
  function durumOku() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); } catch (e) { d = null; }
    var n = basliklar.length;
    if (!d || !Array.isArray(d.sira) || !Array.isArray(d.gorunen) || d.sira.length !== n || d.gorunen.length !== n) return varsayilanDurum();
    if (!d.sira.every(function (x) { return Number.isInteger(x) && x >= 0 && x < n; })) return varsayilanDurum();
    return { sira: d.sira.slice(), gorunen: d.gorunen.map(Boolean) };
  }
  function durumYaz(d) { try { localStorage.setItem(ANAHTAR, JSON.stringify(d)); } catch (e) {} }

  function hucrelereIndeksVer() {
    var satirlar = tablo.querySelectorAll("tbody tr");
    for (var r = 0; r < satirlar.length; r++) {
      var hucreler = satirlar[r].children;
      if (hucreler.length && hucreler[0].getAttribute("data-sutun") !== null) continue;
      for (var c = 0; c < hucreler.length; c++) hucreler[c].setAttribute("data-sutun", String(c));
    }
  }

  function uygula() {
    if (uygulaniyor) return;
    uygulaniyor = true;
    try {
      hucrelereIndeksVer();
      var d = durumOku();
      var baslikSatiri = basliklar[0] ? basliklar[0].parentElement : null;
      if (baslikSatiri) {
        var yeniBasliklar = d.sira.map(function (i) { return basliklar[i]; }).filter(Boolean);
        yeniBasliklar.forEach(function (h, idx) {
          h.setAttribute("data-sutun", String(d.sira[idx]));
          h.style.display = d.gorunen[d.sira[idx]] ? "" : "none";
        });
        yeniBasliklar.forEach(function (h) { baslikSatiri.appendChild(h); });
      }
      var satirlar = tablo.querySelectorAll("tbody tr");
      for (var r = 0; r < satirlar.length; r++) {
        var satir = satirlar[r], harita = {};
        for (var c = 0; c < satir.children.length; c++) {
          var hucre = satir.children[c];
          var ci = Number(hucre.getAttribute("data-sutun") || c);
          harita[ci] = hucre;
          hucre.style.display = d.gorunen[ci] ? "" : "none";
        }
        for (var s = 0; s < d.sira.length; s++) {
          var hc = harita[d.sira[s]];
          if (hc) satir.appendChild(hc);
        }
      }
      tablo.setAttribute("data-sutun-aktif", "1");
      if (sayacEl) sayacEl.textContent = d.gorunen.filter(Boolean).length + "/" + basliklar.length + " sütun";
      panelListeCiz(d);
    } finally {
      uygulaniyor = false;
    }
  }
  function planla() { clearTimeout(zaman); zaman = setTimeout(uygula, 60); }

  function stilEkle() {
    if (document.getElementById("uv-sutun-stil")) return;
    var st = document.createElement("style");
    st.id = "uv-sutun-stil";
    st.textContent = [
      ".uv-tablo-kap{overflow:visible !important;max-height:none !important;height:auto !important}",
      ".uv-tablo-sar{overflow-x:auto;overflow-y:visible;-webkit-overflow-scrolling:touch;",
      "  scrollbar-width:none;-ms-overflow-style:none;max-width:100%;cursor:grab;padding-bottom:2px}",
      ".uv-tablo-sar::-webkit-scrollbar{display:none;height:0}",
      ".uv-tablo-sar.uv-tutuluyor{cursor:grabbing;user-select:none}",
      ".sutun-arac{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 8px}",
      ".sutun-arac .sutun-btn{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:8px 13px;",
      "  border-radius:10px;border:1px solid #2a3f5f;background:linear-gradient(180deg,#15243d,#101b2f);",
      "  color:#dbe7f7;font:650 12.5px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;",
      "  cursor:pointer;transition:background .15s,border-color .15s,transform .12s}",
      ".sutun-arac .sutun-btn:hover{background:linear-gradient(180deg,#1b2f4d,#132138);border-color:#3a5f8a;color:#fff;transform:translateY(-1px)}",
      ".sutun-arac .sutun-btn:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(56,189,248,.35)}",
      ".sutun-arac .sutun-sayac{font-size:11.5px;color:#7f93b2}",
      ".sutun-arac .sutun-ipucu{font-size:11px;color:#63748f;margin-left:2px}",
      ".sutun-panel[hidden]{display:none !important}",
      ".sutun-panel{position:absolute;z-index:120;margin-top:6px;width:330px;max-width:calc(100vw - 24px);",
      "  max-height:380px;overflow:auto;background:#0e1a2d;border:1px solid #2a3f5f;border-radius:14px;",
      "  padding:12px;box-shadow:0 24px 60px rgba(0,0,0,.5)}",
      ".sutun-panel h3{margin:0 0 8px;font-size:11px;letter-spacing:.08em;color:#8fa3c0;text-transform:uppercase}",
      ".sutun-panel .liste{display:flex;flex-direction:column;gap:3px}",
      ".sutun-panel .oge{display:flex;align-items:center;gap:8px;padding:6px 7px;border-radius:8px;border:1px solid transparent}",
      ".sutun-panel .oge:hover{background:rgba(56,189,248,.07);border-color:rgba(56,189,248,.14)}",
      ".sutun-panel .oge label{display:flex;align-items:center;gap:8px;flex:1;min-width:0;font-size:12.5px;color:#dbe7f7;cursor:pointer}",
      ".sutun-panel .oge label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".sutun-panel .oge input{accent-color:#38bdf8;width:15px;height:15px;flex:0 0 auto}",
      ".sutun-panel .oge .oklar{display:flex;gap:3px;flex:0 0 auto}",
      ".sutun-panel .oge .oklar button{width:24px;height:24px;border-radius:6px;border:1px solid #2a3f5f;",
      "  background:#132138;color:#93a4c0;font-size:11px;line-height:1;cursor:pointer}",
      ".sutun-panel .oge .oklar button:hover{color:#fff;border-color:#3a5f8a}",
      ".sutun-panel .alt{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;",
      "  padding-top:10px;border-top:1px solid #1e2c47}",
      ".sutun-panel .alt button{font:700 11.5px/1 inherit;padding:7px 10px;border-radius:8px;cursor:pointer;",
      "  border:1px solid #2a3f5f;background:#132138;color:#c4d2e6}",
      ".sutun-panel .alt button:hover{color:#fff;border-color:#3a5f8a}",
      ".sutun-panel .ipucu{font-size:10.5px;color:#63748f;line-height:1.5;margin-top:8px}",
      "body.tablo-sutun-acik #tbl{min-width:0 !important}",
      ".uv-tam-ekran{position:fixed !important;inset:0 !important;z-index:1200 !important;",
      "  background:#070c16 !important;padding:14px !important;display:flex !important;flex-direction:column !important;",
      "  width:100% !important;height:100% !important;max-width:none !important;max-height:none !important;",
      "  margin:0 !important;border-radius:0 !important;overflow:hidden !important}",
      ".uv-tam-ekran .uv-tablo-sar{flex:1 1 auto;min-height:0;overflow:auto}",
      ".uv-tam-ekran #tbl{font-size:13px}",
      ".uv-tam-ekran .sutun-arac{margin:0 0 10px}",
      "body.uv-tam-kilit{overflow:hidden !important}",
      "@media(max-width:860px){",
      "  body.tablo-sutun-acik #tbl{min-width:0 !important;width:100% !important;font-size:10.5px;table-layout:fixed !important}",
      "  body.tablo-sutun-acik #tbl th, body.tablo-sutun-acik #tbl td{padding:6px 4px !important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "  .sutun-arac .sutun-ipucu{display:none}",
      "  .sutun-panel{position:fixed;left:12px;right:12px;top:auto;bottom:80px;width:auto;max-height:60vh}",
      "}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ---------- sarmalayıcı: kaydırma çubuğu gizli, sürükle-kaydır ---------- */
  function sarmalKur() {
    kap = tablo.closest(".tbl-wrap") || tablo.closest(".panel") || tablo.parentElement;
    if (!kap) return;
    kap.classList.add("uv-tablo-kap");
    sar = document.createElement("div");
    sar.className = "uv-tablo-sar";
    tablo.parentNode.insertBefore(sar, tablo);
    sar.appendChild(tablo);

    sar.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      if (e.target.closest("input, select, textarea, label")) return;
      surukluyor = true;
      surukleBasladi = false;
      tikEngelle = false;
      baslaX = e.clientX;
      baslaScroll = sar.scrollLeft;
    });
    document.addEventListener("mousemove", function (e) {
      if (!surukluyor) return;
      var fark = e.clientX - baslaX;
      if (!surukleBasladi && Math.abs(fark) > 4) {
        surukleBasladi = true;
        tikEngelle = true;
        sar.classList.add("uv-tutuluyor");
      }
      if (surukleBasladi) {
        sar.scrollLeft = baslaScroll - fark;
        e.preventDefault();
      }
    }, { passive: false });
    document.addEventListener("mouseup", function () {
      if (!surukluyor) return;
      surukluyor = false;
      sar.classList.remove("uv-tutuluyor");
      if (surukleBasladi) {
        setTimeout(function () { tikEngelle = false; }, 60);
      }
    });
    // sürükleme sonrası yanlışlıkla tıklama/sıralama olmasın
    sar.addEventListener("click", function (e) {
      if (tikEngelle) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  /* ---------- tam ekran ---------- */
  function tamEkranAc() {
    if (!kap) return;
    kap.classList.add("uv-tam-ekran");
    document.body.classList.add("uv-tam-kilit");
    if (tamBtn) { tamBtn.innerHTML = "✕ Tam ekrandan çık"; tamBtn.setAttribute("aria-pressed", "true"); }
    if (panel) { panel.hidden = true; if (buton) buton.setAttribute("aria-expanded", "false"); }
    window.dispatchEvent(new Event("resize"));
  }
  function tamEkranKapat() {
    if (!kap) return;
    kap.classList.remove("uv-tam-ekran");
    document.body.classList.remove("uv-tam-kilit");
    if (tamBtn) { tamBtn.innerHTML = "⛶ Tam ekran"; tamBtn.setAttribute("aria-pressed", "false"); }
  }
  function tamEkranToggle() {
    if (kap.classList.contains("uv-tam-ekran")) tamEkranKapat(); else tamEkranAc();
  }

  /* ---------- panel ---------- */
  function panelKonumla() {
    if (!panel || !buton || panel.hidden) return;
    var r = buton.getBoundingClientRect();
    var genis = Math.min(330, window.innerWidth - 24);
    var sol = Math.max(12, Math.min(r.left, window.innerWidth - genis - 12));
    var ust = r.bottom + 6;
    if (ust + 220 > window.innerHeight) ust = Math.max(12, r.top - Math.min(380, window.innerHeight - 40) - 6);
    panel.style.position = "fixed";
    panel.style.left = sol + "px";
    panel.style.top = Math.round(ust) + "px";
    panel.style.maxHeight = Math.max(160, window.innerHeight - ust - 12) + "px";
    panel.style.width = genis + "px";
    panel.style.display = "block";
  }

  function panelListeCiz(d) {
    if (!panel) return;
    var gorunenAdet = d.gorunen.filter(Boolean).length;
    var html = '<h3>Sütunlar · görünen ' + gorunenAdet + "/" + basliklar.length + '</h3><div class="liste">';
    for (var s = 0; s < d.sira.length; s++) {
      var i = d.sira[s];
      var ad = metinTemiz(basliklar[i] ? basliklar[i].innerText : "Sütun " + (i + 1)) || ("Sütun " + (i + 1));
      html += '<div class="oge" data-i="' + i + '">' +
        '<label><input type="checkbox" data-i="' + i + '"' + (d.gorunen[i] ? " checked" : "") + '>' +
        '<span>' + ad.replace(/</g, "&lt;") + '</span></label>' +
        '<span class="oklar">' +
        '<button type="button" data-yukari="' + s + '" title="Yukarı taşı" aria-label="Yukarı taşı">↑</button>' +
        '<button type="button" data-asagi="' + s + '" title="Aşağı taşı" aria-label="Aşağı taşı">↓</button>' +
        '</span></div>';
    }
    html += '</div><div class="alt"><button type="button" id="sutunSifirla">Varsayılana dön</button>' +
      '<button type="button" id="sutunKapat">Kapat</button></div>' +
      '<div class="ipucu">Sıralamak için ↑ ↓ kullan. Tercihin bu tarayıcıda saklanır.</div>';
    panel.innerHTML = html;

    panel.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        var g = durumOku(), i = Number(cb.getAttribute("data-i"));
        g.gorunen[i] = cb.checked;
        if (!g.gorunen.some(Boolean)) { g.gorunen[i] = true; cb.checked = true; return; }
        durumYaz(g); uygula();
      });
    });
    panel.querySelectorAll("[data-yukari]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = Number(b.getAttribute("data-yukari"));
        if (s <= 0) return;
        var g = durumOku(), t = g.sira[s - 1]; g.sira[s - 1] = g.sira[s]; g.sira[s] = t;
        durumYaz(g); uygula();
      });
    });
    panel.querySelectorAll("[data-asagi]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = Number(b.getAttribute("data-asagi"));
        var g = durumOku();
        if (s >= g.sira.length - 1) return;
        var t = g.sira[s + 1]; g.sira[s + 1] = g.sira[s]; g.sira[s] = t;
        durumYaz(g); uygula();
      });
    });
    var sifirla = panel.querySelector("#sutunSifirla");
    if (sifirla) sifirla.addEventListener("click", function () {
      try { localStorage.removeItem(ANAHTAR); } catch (e) {}
      uygula();
    });
    var kapat = panel.querySelector("#sutunKapat");
    if (kapat) kapat.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); panel.hidden = true; panel.style.display = "none"; buton.setAttribute("aria-expanded", "false"); });
  }

  function aracKur() {
    var arac = document.createElement("div");
    arac.className = "sutun-arac";
    buton = document.createElement("button");
    buton.type = "button";
    buton.className = "sutun-btn";
    buton.setAttribute("aria-expanded", "false");
    buton.innerHTML = "☰ Sütunlar";
    tamBtn = document.createElement("button");
    tamBtn.type = "button";
    tamBtn.className = "sutun-btn";
    tamBtn.setAttribute("aria-pressed", "false");
    tamBtn.innerHTML = "⛶ Tam ekran";
    sayacEl = document.createElement("span");
    sayacEl.className = "sutun-sayac";
    var ipucu = document.createElement("span");
    ipucu.className = "sutun-ipucu";
    ipucu.textContent = "Tabloyu fareyle tutup sağa/sola sürükleyebilirsin";
    arac.appendChild(buton);
    arac.appendChild(tamBtn);
    arac.appendChild(sayacEl);
    arac.appendChild(ipucu);
    kap.insertBefore(arac, sar);

    panel = document.createElement("div");
    panel.className = "sutun-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Sütun seçimi");
    arac.appendChild(panel);

    buton.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      if (panel.hidden) panel.style.display = "none";
      buton.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
      if (!panel.hidden) { panelListeCiz(durumOku()); panelKonumla(); }
    });
    tamBtn.addEventListener("click", tamEkranToggle);
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== buton) {
        panel.hidden = true; panel.style.display = "none";
        buton.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (!panel.hidden) { panel.hidden = true; buton.setAttribute("aria-expanded", "false"); }
        if (kap.classList.contains("uv-tam-ekran")) tamEkranKapat();
      }
    });
    window.addEventListener("scroll", function () {
      if (panel && !panel.hidden) { panel.hidden = true; buton.setAttribute("aria-expanded", "false"); }
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (panel && !panel.hidden) { panel.hidden = true; buton.setAttribute("aria-expanded", "false"); }
    });
    document.body.classList.add("tablo-sutun-acik");
  }

  if (!basliklariAl()) return;
  stilEkle();
  sarmalKur();
  aracKur();
  uygula();

  var tbody = tablo.querySelector("tbody");
  if (tbody && window.MutationObserver) {
    govdeGozlemci = new MutationObserver(function () { planla(); });
    govdeGozlemci.observe(tbody, { childList: true });
  }
  var thead = tablo.querySelector("thead");
  if (thead && window.MutationObserver) {
    new MutationObserver(function () { planla(); }).observe(thead, { childList: true });
  }
})();
