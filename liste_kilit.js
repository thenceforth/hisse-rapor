/* Uzun Vade — liste kilidi
 *
 * Ana tablodaki ucretli alanlar (AL/IZLE etiketi, giris skoru, kisa liste
 * sayaclari) HTML'de bos gelir. Giris yapan uye icin Supabase'deki
 * public.analiz tablosundan cekilip doldurulur.
 */
(function () {
  "use strict";
  var A = window.HT_AYAR || (window.HT_DB ? { SUPABASE_URL: window.HT_DB.URL, SUPABASE_KEY: window.HT_DB.KEY } : {});
  if (!A.SUPABASE_URL) return;

  var ROZET_SINIF = { "AL": "b-AL", "IZLE": "b-IZLE", "GEC": "b-GEC", "BEKLE": "b-BEKLE" };
  var ETIKET_ADI = { "AL": "Güçlü", "IZLE": "Takip", "GEC": "Zayıf", "BEKLE": "Nötr" };

  function oturum() {
    try { return JSON.parse(localStorage.getItem("ht_oturum") || "null"); } catch (e) { return null; }
  }

  function doldur(harita) {
    var etiketler = document.querySelectorAll("td.c-etiket[data-t]");
    var girisler = document.querySelectorAll("td.c-giris[data-t]");
    var al = 0, kisa = 0;

    etiketler.forEach(function (td) {
      var v = harita[td.getAttribute("data-t")];
      var et = v && v.metrik && v.metrik.etiket;
      if (!et) return;
      td.innerHTML = '<span class="badge ' + (ROZET_SINIF[et] || "") + '">' + (ETIKET_ADI[et] || et) + "</span>";
      td.removeAttribute("data-t");
      if (et === "AL") al++;
    });

    girisler.forEach(function (td) {
      var v = harita[td.getAttribute("data-t")];
      var sk = v && v.zengin && v.zengin.giris_skor;
      if (sk === null || sk === undefined) return;
      var renk = sk >= 70 ? "#10b981" : "#e6edf7";
      td.innerHTML = '<b style="color:' + renk + '">' + Math.round(sk) + "</b>";
      td.setAttribute("data-sort", String(sk));
      td.removeAttribute("data-t");
    });

    // kisa liste: skoru yuksek + AL etiketli satirlar (yaklasik gosterim)
    var satirlar = document.querySelectorAll('tr[data-ticker]');
    satirlar.forEach(function (tr) {
      var t = tr.getAttribute("data-ticker");
      var v = harita[t];
      if (!v || !v.metrik) return;
      var kisa_mi = v.metrik.etiket === "AL" && (v.zengin && v.zengin.giris_skor >= 70);
      if (kisa_mi) {
        kisa++;
        var hs = tr.querySelector(".c-hisse");
        if (hs && !hs.querySelector(".yildiz")) {
          var s = document.createElement("span");
          s.className = "yildiz";
          s.title = "Kısa liste";
          s.textContent = "★";
          hs.appendChild(s);
        }
      }
    });

    // one cikanlar kartlarindaki skor
    document.querySelectorAll(".one-ust").forEach(function (ust) {
      var hs = ust.querySelector(".one-hs");
      var sk = ust.querySelector(".one-skor");
      if (!hs || !sk) return;
      var t = (hs.textContent || "").trim();
      var v = harita[t];
      var puan = v && v.zengin && v.zengin.giris_skor;
      if (puan === null || puan === undefined) return;
      sk.textContent = Math.round(puan);
      sk.classList.remove("uyelik-bulanik");
    });

    // kisa liste sayaci = yildiz sayisi
    kisa = document.querySelectorAll(".yildiz").length;

    var kpiAl = document.getElementById("kpiAl");
    if (kpiAl) { kpiAl.textContent = al; kpiAl.classList.add("acik"); }
    var kpiKisa = document.getElementById("kpiKisa");
    if (kpiKisa) { kpiKisa.textContent = kisa; kpiKisa.classList.add("acik"); }
    document.body.classList.add("liste-acik");
  }

  function basla() {
    var s = oturum();
    if (!s || !s.access_token) return;
    var url = A.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/analiz?select=ticker,veri";
    fetch(url, { headers: { apikey: A.SUPABASE_KEY, Authorization: "Bearer " + s.access_token } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (j) {
        var harita = {};
        (j || []).forEach(function (x) { harita[x.ticker] = x.veri; });
        if (Object.keys(harita).length) doldur(harita);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", basla);
  } else {
    basla();
  }
})();
