self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open("anstudy-cache").then(cache=>{
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./logo_192x192.png",
        "./logo_512x512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(resp=>{
      return resp || fetch(e.request);
    })
  );
});
