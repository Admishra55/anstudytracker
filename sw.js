// Simple PWA cache for offline shell + last-viewed PDFs
const CACHE = "anstudytracker-v2.1";
const CORE = [
  "./",
  "index.html",
  "manifest.json",
  "logo_192x192.png",
  "logo_512x512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// Network-first for PDFs; Cache-first for core
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Only handle GET
  if (e.request.method !== "GET") return;

  const isPDF = url.pathname.endsWith(".pdf");
  const isCore = CORE.some(p => url.pathname.endsWith(p.replace("./","")));

  if (isCore) {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }))
    );
    return;
  }

  if (isPDF) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // default: stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cacheRes => {
      const fetchPromise = fetch(e.request).then(networkRes => {
        caches.open(CACHE).then(c => c.put(e.request, networkRes.clone()));
        return networkRes;
      }).catch(()=>cacheRes);
      return cacheRes || fetchPromise;
    })
  );
});
