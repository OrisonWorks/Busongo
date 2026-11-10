// Busongo offline support: keeps public pages you have opened, so they still load with no signal.
const V = "v1";
const PAGES = `pages-${V}`;
const ASSETS = `assets-${V}`;
const PRECACHE = ["/kwacha-today", "/lite", "/offline"];
// Plain HTML (not the Next.js /offline page): a Next page served under a different URL breaks React hydration.
const OFFLINE_HTML = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Busongo</title><style>body{font:18px/1.5 system-ui,sans-serif;background:#070b14;color:#e6ebf5;max-width:34em;margin:4em auto;padding:0 1em;text-align:center}a{display:inline-block;margin:.4em;padding:.6em 1.2em;border-radius:.6em;background:#10b981;color:#04120c;text-decoration:none;font-weight:600}p.g{color:#8a96b0}</style></head><body><h1>You\u2019re offline</h1><p class="g">Busongo can\u2019t reach the internet right now. Pages you opened before still work, including Kwacha Today.</p><a href="/kwacha-today">Kwacha Today</a><a href="/lite">Text-only</a></body></html>';
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
    // Re-prime after clearing (logout is online anyway) so offline pages and the fallback survive,
    // and nothing saved keeps signed-in HTML.
    e.waitUntil(caches.delete(PAGES).then(() => caches.open(PAGES)).then((c) => c.addAll(PRECACHE)));
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
          new Response(OFFLINE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } }),
        ),
    );
  }
});
