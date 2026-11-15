/* Horn service worker: the page is always network first (no HTTP cache, 3 s limit), cache only when offline */
const C = "horn-v131";
const FILES = ["./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"]; // m122C: no separate "./" entry (key() maps navigations to ./index.html), so the page is cached once, not twice
const LIMIT = 3000;
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(f => fetch(f, { cache: "reload" }).then(r => r.ok ? c.put(f, r) : null).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf("horn-") === 0 && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()).then(() => self.clients.matchAll({ type: "window" })).then(cs => cs.forEach(c => c.postMessage({ horn: C }))));
});
function key(r) { const u = new URL(r.url); return (r.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("/index.html")) ? "./index.html" : u.pathname; }
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  const k = key(r), isVer = u.pathname.endsWith("/version.txt");
  const net = fetch(r.url, { cache: "no-store", credentials: "same-origin" }).then(res => {
    if (res.ok && !isVer) { const cp = res.clone(); caches.open(C).then(c => c.put(k, cp)).catch(() => {}); }
    return res;
  });
  const cached = () => caches.open(C).then(c => c.match(k, { ignoreSearch: true })).then(m => m || caches.match("./index.html"));
  const wait = new Promise(res => setTimeout(() => res(null), LIMIT));
  e.respondWith(Promise.race([net.catch(() => null), wait]).then(res => res || (isVer ? net : cached().then(m => m || net))).catch(() => cached().then(m => m || Response.error())));
});
