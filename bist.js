(function(){
  var ara = document.getElementById('ara');
  var satir = document.getElementById('sayac');
  var fbtn = document.querySelectorAll('.fbtn');
  var sektorSec = document.getElementById('sektorSec');
  var roicSec = document.getElementById('roicSec');
  var roeSec = document.getElementById('roeSec');
  var pdddSec = document.getElementById('pdddSec');
  var fkSec = document.getElementById('fkSec');
  var temSec = document.getElementById('temSec');
  var siralaSec = document.getElementById('siralaSec');
  var tbl = document.getElementById('tbl');
  var govde = tbl.tBodies[0];
  var filtre = 'ALL';

  function sayi(el, veri, varsayilan){
    var v = parseFloat(el.dataset[veri]);
    return isNaN(v) ? (varsayilan === undefined ? -1e9 : varsayilan) : v;
  }
  var YON = {pddd:-1, fk:-1};  // dusuk olan onde
  function sirala(k){
    var satirlar = Array.prototype.slice.call(govde.rows);
    var ters = {skor:1, roic:1, roe:1, r3:1, r12:1};
    var anahtar = {ticker:'ticker', ad:'ara', sektor:'sektor', mcap:'mcap'};
    satirlar.sort(function(a,b){
      var x, y;
      if (k === 'ticker' || k === 'ad' || k === 'sektor') {
        x = (a.dataset.ara||''); y = (b.dataset.ara||'');
        return x < y ? -1 : x > y ? 1 : 0;
      }
      x = parseFloat(a.dataset[k]); y = parseFloat(b.dataset[k]);
      if (isNaN(x)) x = YON[k] === -1 ? 1e15 : -1e15;
      if (isNaN(y)) y = YON[k] === -1 ? 1e15 : -1e15;
      return YON[k] === -1 ? x - y : y - x;
    });
    satirlar.forEach(function(r){ govde.appendChild(r); });
  }
  function uygula(){
    var q = (ara.value || '').toLowerCase().trim();
    var sec = sektorSec.value;
    var roicMin = parseFloat(roicSec.value) || 0;
    var roeMin = parseFloat(roeSec.value) || 0;
    var pdddMax = parseFloat(pdddSec.value) || 999;
    var fkMax = parseFloat(fkSec.value) || 999;
    var temMin = parseFloat(temSec.value) || 0;
    var n = 0;
    Array.prototype.forEach.call(govde.rows, function(r){
      var d = r.dataset;
      var ok = true;
      if (filtre === 'GEC' && d.gecti !== '1') ok = false;
      if (filtre === 'KAL' && d.gecti !== '0') ok = false;
      if (['Sanayi','Banka','GYO','Holding','Finans','Sigorta'].indexOf(filtre) >= 0 && d.tur !== filtre) ok = false;
      if (sec && d.sektor !== sec) ok = false;
      if (q && (d.ara || '').indexOf(q) < 0) ok = false;
      if (roicMin > 0 && (d.roic === '' || parseFloat(d.roic) < roicMin)) ok = false;
      if (roeMin > 0 && (d.roe === '' || parseFloat(d.roe) < roeMin)) ok = false;
      if (pdddMax < 999 && (d.pddd === '' || parseFloat(d.pddd) > pdddMax)) ok = false;
      if (fkMax < 999 && (d.fk === '' || parseFloat(d.fk) > fkMax)) ok = false;
      if (temMin > 0 && (d.temettu === '' || parseFloat(d.temettu) < temMin)) ok = false;
      r.style.display = ok ? '' : 'none';
      if (ok) n++;
    });
    satir.textContent = n;
  }
  fbtn.forEach(function(b){
    b.addEventListener('click', function(){
      fbtn.forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      filtre = b.dataset.f;
      uygula();
    });
  });
  [ara, sektorSec, roicSec, roeSec, pdddSec, fkSec, temSec].forEach(function(el){
    el.addEventListener(el === ara ? 'input' : 'change', uygula);
  });
  siralaSec.addEventListener('change', function(){ sirala(siralaSec.value); uygula(); });
  Array.prototype.forEach.call(tbl.tHead.rows[0].cells, function(th, i){
    th.addEventListener('click', function(){
      var anahtar = ['sira','ticker','ad','tur','sektor','gecti','sebep','roic','roe','nd','pio',
                     'fk','pddd','tem','marj','mcap','r3','r12','xu','rsi','dip','skor'][i];
      if (anahtar === 'sira') return;
      if (anahtar) { sirala(anahtar); }
    });
  });
  sirala('skor');
  uygula();
})();


/* --- favori yıldızları (izleme listesiyle aynı davranış) --- */
(function () {
  "use strict";
  var K = "hisse_favoriler";
  function oku() { try { return new Set(JSON.parse(localStorage.getItem(K) || "[]")); } catch (e) { return new Set(); } }
  function yaz(set) { try { localStorage.setItem(K, JSON.stringify(Array.from(set))); } catch (e) {} }
  function siraYenile() {
    var n = 0;
    document.querySelectorAll("#tbl tbody tr").forEach(function (tr) {
      if (tr.style.display === "none" || tr.hidden) return;
      var c = tr.querySelector(".c-sira");
      if (c) { n++; c.textContent = n; }
    });
  }
  function isaretle() {
    var f = oku();
    document.querySelectorAll("#tbl .fav").forEach(function (b) {
      var t = b.getAttribute("data-t");
      var on = f.has(t);
      b.textContent = on ? "★" : "☆";
      b.classList.toggle("on", on);
    });
    siraYenile();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("#tbl .fav");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var t = b.getAttribute("data-t");
    var f = oku();
    if (f.has(t)) f.delete(t); else f.add(t);
    yaz(f); isaretle();
  }, true);
  var tb = document.querySelector("#tbl tbody");
  if (tb) new MutationObserver(function () { setTimeout(isaretle, 0); }).observe(tb, { childList: true, attributes: true, attributeFilter: ["style", "hidden"] });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", isaretle);
  else isaretle();
  setTimeout(isaretle, 500);
})();
