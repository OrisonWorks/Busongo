// Busongo offline support: keeps public pages you have opened, so they still load with no signal.
const V = "v1";
const PAGES = `pages-${V}`;
const ASSETS = `assets-${V}`;
const PRECACHE = ["/kwacha-today", "/lite", "/offline"];
const PUBLIC = /^\/(kwacha-today|lite|offline|market|macro|fixed-income|stocks|sens|fundamentals|calendar|data|reference|blog|about)?(\/|$)/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Signing out (a POST) clears saved pages: they can hold the signed-in name and email.
  if (url.pathname === "/logout") {
    e.waitUntil(caches.delete(PAGES));
    return;
  }
  if (req.method !== "GET") return;

  // Build files never change once published.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(ASSETS).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  if (req.mode === "navigate") {
    const keep = PUBLIC.test(url.pathname);
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (keep && res.ok && !res.redirected) { const copy = res.clone(); caches.open(PAGES).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(async () =>
          (await caches.match(req)) ||
          // e.g. /lite?lang=bem when only /lite was saved: the same page in another language beats the offline notice.
          (/^\/(kwacha-today|lite)$/.test(url.pathname) && (await caches.match(req, { ignoreSearch: true }))) ||
          caches.match("/offline"),
        ),
    );
  }
});
