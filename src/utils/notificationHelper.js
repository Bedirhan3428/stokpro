// Kullanıcıdan bildirim izni ister
export async function bildirimIzniIste() {
  if (!("Notification" in window)) {
    console.log("Bu tarayıcı bildirimleri desteklemiyor.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Bildirimi gönderen fonksiyon
export function bildirimGonder(baslik, icerik) {
  if (Notification.permission === "granted") {
    // Mobil cihazlarda titreşim ve ses için options
    const options = {
      body: icerik,
      icon: "/logo192.png", // public klasöründe logo varsa kullanır
      vibrate: [200, 100, 200], // Titreşim deseni (Mobilde)
      tag: "stok-uyari" // Aynı bildirimden üst üste gelmesini engeller
    };

    // Servis çalışanı (Service Worker) varsa onu kullan (Daha kararlı mobilde)
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(baslik, options);
      });
    } else {
      // Yoksa standart bildirim
      new Notification(baslik, options);
    }
  }
}