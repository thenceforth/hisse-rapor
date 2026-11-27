/* Uzun Vade — service worker (PWA kabuk)
 *
 * Strateji:
 *  - HTML/JSON: network-first (veri taze kalsin), hata olursa cache
 *  - statik (js/css/png/svg): cache-first + arka planda guncelle
 */
const SURUM = "uv-v1";
const STATIK = [
  "/", "/favicon.svg", "/ikon-192.png", "/ikon-512.png",
  "/ui.js", "/anasayfa.js", "/yenile.js", "/liste_kilit.js", "/olcum.js",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SURUM).then((c) => c.addAll(STATIK).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((adlar) =>
      Promise.all(adlar.filter((a) => a !== SURUM).map((a) => caches.delete(a)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const html = req.headers.get("accept") || "";
  const veri = url.pathname.endsWith(".json") || url.pathname.endsWith(".xml");

  if (html.includes("text/html") || veri) {
    // network-first
    e.respondWith(
      fetch(req).then((r) => {
        const kopya = r.clone();
        caches.open(SURUM).then((c) => c.put(req, kopya)).catch(() => {});
        return r;
      }).catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // statik: cache-first
  e.respondWith(
    caches.match(req).then((cacheli) => {
      const ag = fetch(req).then((r) => {
        const kopya = r.clone();
        caches.open(SURUM).then((c) => c.put(req, kopya)).catch(() => {});
        return r;
      }).catch(() => cacheli);
      return cacheli || ag;
    })
  );
});
