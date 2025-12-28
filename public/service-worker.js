const CACHE_NAME = "stokpro-v3"; // Sürümü artırdık ki yenilensin

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// YÜKLEME (Install) - Dosyaları Önbelleğe Al
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("StokPro: Dosyalar önbelleğe alınıyor...");
      return cache.addAll(urlsToCache);
    })
  );
});

// AKTİFLEŞTİRME (Activate) - Eskileri Temizle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("StokPro: Eski önbellek silindi ->", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// İSTEKLERİ YAKALAMA (Fetch Strategy)
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. MANIFEST VE İKONLAR İÇİN: Cache First (Hafızadan Oku)
  // Bu kural PWABuilder hatasını çözen kısımdır.
  if (
    requestUrl.pathname.includes("manifest.json") ||
    requestUrl.pathname.includes("logo") ||
    requestUrl.pathname.includes("favicon")
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // 2. SAYFA GEÇİŞLERİ İÇİN: Network First (Önce İnternet)
  // Beyaz ekran sorununu çözen kural.
  if (event.request.mode === 'navigate' || requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // İnternet yoksa hafızadaki index.html'i ver
          return caches.match("/index.html");
        })
    );
    return;
  }

  // 3. DİĞER HER ŞEY (CSS, JS, Resimler): Stale-While-Revalidate
  // Önce hafızadakini göster, arkada yenisini çekip güncelle.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});