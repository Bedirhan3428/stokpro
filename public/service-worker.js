// Cache ismini değiştirdim (v2), bu sayede kullanıcılar girdiğinde
// eski bozuk önbellek silinip yenisi oluşacak.
const CACHE_NAME = "stokpro-v2";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
  // Diğer statik dosyalar buraya eklenebilir
];

// YÜKLEME (Install)
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Yeni versiyon varsa bekleme, hemen aktif ol
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Önbellek (v2) oluşturuluyor...");
      return cache.addAll(urlsToCache);
    })
  );
});

// AKTİFLEŞTİRME (Activate) - Eski önbellekleri temizle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Eski önbellek silindi:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Tüm sekmelerin kontrolünü hemen ele al
});

// İSTEKLERİ YÖNETME (Fetch Strategy)
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. HTML İSTEKLERİ (Sayfa geçişleri): Network First (Önce İnternet)
  // Bu, "Beyaz Ekran" sorununun kesin çözümüdür.
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
          // İnternet yoksa önbellekten döndür
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. DİĞER İSTEKLER (Resim, JS, CSS): Cache First (Önce Önbellek)
  // Hız için önce hafızaya bakar, yoksa internetten çeker.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Dinamik olarak yeni dosyaları da önbelleğe atalım (Opsiyonel ama iyi olur)
        // Sadece geçerli cevapları cache'le
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});