/* OCB service worker: makes the site installable and keeps it usable on a weak connection.
   Pages, settings and code are always fetched fresh when online, so your edits show up straight away.
   Photos are served from the saved copy first and refreshed in the background. */
const CACHE = "ocb-store-v1";
const CORE = ["./", "index.html", "config.js", "css/styles.css", "js/app.js", "manifest.webmanifest", "icons/icon-192.png"];

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
  if (url.origin !== self.location.origin) return;                 // Firebase, Razorpay, fonts: leave alone
  if (req.headers.has("range") || /\.(mp4|webm)$/i.test(url.pathname)) return;   // let the browser stream video itself

  const isPhoto = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(url.pathname);
  if (isPhoto) {
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
  e.respondWith(
    fetch(req)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
