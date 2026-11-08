/* Horn: 인터넷이 없을 때 마지막으로 받은 앱을 엽니다. 인터넷이 있으면 항상 새 판을 먼저 받습니다 */
const C = "horn-v107";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match("./index.html"))));
});
