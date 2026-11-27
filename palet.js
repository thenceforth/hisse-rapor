// Hızlı arama (Ctrl+K) — tüm sayfalarda ortak.
// veri/_liste.json dosyasını okur, seçilen hissenin detay sayfasına gider.
(function () {
  const host = document.createElement('div');
  host.id = 'palette';
  host.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(4,8,16,.72);z-index:200;' +
    'align-items:flex-start;justify-content:center;padding-top:12vh';
  host.innerHTML =
    '<div style="width:min(540px,92vw);background:#0d1729;border:1px solid #2f4a76;border-radius:14px;' +
    'overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.6)">' +
    '<input id="paletteAra" placeholder="Hisse ara… (Ctrl+K · Esc kapat)" ' +
    'style="width:100%;background:transparent;border:none;border-bottom:1px solid #1e2c47;color:#e6edf7;' +
    'padding:14px 16px;font-size:15px;outline:none">' +
    '<div id="paletteListe" style="max-height:46vh;overflow:auto"></div></div>';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(host));

  let L = [];
  let sec = 0;
  let yuklendi = false;

  function veriYukle() {
    if (yuklendi) return Promise.resolve();
    return fetch('veri/_liste.json')
      .then(r => r.json())
      .then(x => { L = x || []; yuklendi = true; })
      .catch(() => { yuklendi = true; });
  }

  function cizListe() {
    const inp = document.getElementById('paletteAra');
    const lst = document.getElementById('paletteListe');
    const q = (inp.value || '').toLowerCase().trim();
    const bul = L.filter(x => !q || (x.t || '').toLowerCase().includes(q) || (x.ad || '').toLowerCase().includes(q)).slice(0, 12);
    sec = 0;
    lst.innerHTML = bul.map((x, i) =>
      '<div class="pItem" data-t="' + x.t + '" style="padding:11px 16px;cursor:pointer;display:flex;' +
      'justify-content:space-between;background:' + (i === 0 ? '#13223a' : 'transparent') +
      ';border-bottom:1px solid #14203a">' +
      '<span style="font-family:ui-monospace,monospace;font-weight:700">' + x.t + '</span>' +
      '<span style="color:#5b6b86;font-size:12px">' + (x.ad || '').slice(0, 44) + '</span></div>'
    ).join('') || '<div style="padding:16px;color:#5b6b86">sonuç yok</div>';
    lst.querySelectorAll('.pItem').forEach(el => {
      el.onclick = () => git(el.dataset.t);
    });
    window.__paletBul = bul;
  }

  function git(t) {
    location.href = 'hisse.html?t=' + encodeURIComponent(t);
  }

  function ac() {
    veriYukle().then(() => {
      host.style.display = 'flex';
      document.getElementById('paletteAra').value = '';
      cizListe();
      document.getElementById('paletteAra').focus();
    });
  }

  function kapat() { host.style.display = 'none'; }

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      ac();
      return;
    }
    if (host.style.display === 'none') return;
    if (e.key === 'Escape') kapat();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = [...host.querySelectorAll('.pItem')];
      if (!items.length) return;
      items.forEach(x => { x.style.background = 'transparent'; });
      sec = (sec + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[sec].style.background = '#13223a';
      items[sec].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' && window.__paletBul && window.__paletBul[sec]) git(window.__paletBul[sec].t);
  });

  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'paletteAra') cizListe();
  });
  host.addEventListener('click', e => { if (e.target === host) kapat(); });

  window.paletAc = ac;
})();
