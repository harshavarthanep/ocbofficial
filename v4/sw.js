/* OCB service worker · version 4
   Makes the site installable and keeps it usable on a weak connection.
   Pages, settings, styles and code always come fresh from GitHub when online,
   so every upload shows straight away. Photos are kept for speed.
   Changing CACHE below clears every phone's saved copy on its next visit. */
const CACHE = "ocb-store-v4-2";
const CORE = ["./", "index.html", "config.js?v=4", "css/styles.css?v=4", "js/app.js?v=4", "manifest.webmanifest?v=4", "icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                 // Firebase, Stripe, Razorpay, fonts: leave alone

  if (/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) => {
          const fresh = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
          return hit || fresh;
        })
      )
    );
    return;
  }
  /* everything else: always ask GitHub first, skipping the browser's own short-term copy */
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
