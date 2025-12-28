const CACHE_NAME = "stokpro-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// Yükleme (Install)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Önbellek açıldı");
      return cache.addAll(urlsToCache);
    })
  );
});

// İstekleri Yakalama (Fetch) - PWA için KRİTİK KISIM
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Önbellekte varsa onu döndür, yoksa internetten çek
      return response || fetch(event.request);
    })
  );
});

// Güncelleme (Activate)
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});