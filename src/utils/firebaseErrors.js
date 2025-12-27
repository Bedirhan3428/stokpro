// Firebase Hata Kodları ve Türkçe Mesajları
export const firebaseErrors = {
  // ==================== AUTHENTICATION HATALARI ====================
  
  // Giriş / Kayıt Hataları
  "auth/user-not-found":  "Bu e-posta ile kayıtlı kullanıcı bulunamadı.",
  "auth/wrong-password": "Hatalı parola.  Lütfen tekrar deneyin.",
  "auth/invalid-email": "Geçersiz e-posta adresi.",
  "auth/email-already-in-use": "Bu e-posta adresi zaten kullanımda.",
  "auth/weak-password": "Parola çok zayıf. En az 6 karakter kullanın.",
  "auth/invalid-credential": "Geçersiz kimlik bilgileri.  E-posta veya parolayı kontrol edin.",
  "auth/invalid-login-credentials": "E-posta veya parola hatalı.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/account-exists-with-different-credential": "Bu e-posta farklı bir giriş yöntemiyle kayıtlı.",
  
  // Oturum Hataları
  "auth/requires-recent-login":  "Bu işlem için yeniden giriş yapmanız gerekiyor.",
  "auth/user-token-expired": "Oturum süresi doldu.  Lütfen tekrar giriş yapın.",
  "auth/invalid-user-token": "Geçersiz oturum.  Lütfen tekrar giriş yapın.",
  "auth/session-expired": "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
  
  // E-posta Doğrulama Hataları
  "auth/invalid-action-code": "Doğrulama bağlantısı geçersiz veya süresi dolmuş.",
  "auth/expired-action-code":  "Bağlantı süresi dolmuş. Yeni bir bağlantı isteyin.",
  "auth/missing-action-code":  "Doğrulama kodu eksik.",
  
  // Şifre Sıfırlama Hataları
  "auth/invalid-continue-uri": "Geçersiz yönlendirme URL'si.",
  "auth/unauthorized-continue-uri": "Domain yetkili listede değil.",
  "auth/missing-continue-uri":  "Yönlendirme URL'si eksik.",
  
  // Rate Limiting
  "auth/too-many-requests":  "Çok fazla deneme yaptınız. Lütfen bir süre bekleyin.",
  "auth/quota-exceeded": "İstek kotası aşıldı. Daha sonra tekrar deneyin.",
  
  // Ağ Hataları
  "auth/network-request-failed": "Bağlantı hatası. İnternet bağlantınızı kontrol edin.",
  "auth/timeout": "İstek zaman aşımına uğradı. Tekrar deneyin.",
  
  // Google / Sosyal Giriş Hataları
  "auth/popup-closed-by-user": "Giriş penceresi kapatıldı.  Lütfen tekrar deneyin.",
  "auth/popup-blocked": "Açılır pencere engellendi. Lütfen izin verin.",
  "auth/cancelled-popup-request": "Giriş işlemi iptal edildi.",
  "auth/operation-not-allowed":  "Bu giriş yöntemi etkin değil.",
  "auth/unauthorized-domain": "Bu domain yetkili değil.",
  
  // Telefon Doğrulama
  "auth/invalid-phone-number":  "Geçersiz telefon numarası.",
  "auth/missing-phone-number":  "Telefon numarası gerekli.",
  "auth/invalid-verification-code": "Geçersiz doğrulama kodu.",
  "auth/invalid-verification-id": "Geçersiz doğrulama ID'si.",
  "auth/code-expired": "Doğrulama kodu süresi doldu.",
  "auth/captcha-check-failed": "Captcha doğrulaması başarısız.",
  
  // Multi-Factor Authentication
  "auth/multi-factor-auth-required": "İki faktörlü doğrulama gerekli.",
  "auth/second-factor-already-in-use": "Bu ikinci faktör zaten kullanımda.",
  "auth/maximum-second-factor-count-exceeded": "Maksimum ikinci faktör sayısı aşıldı.",
  
  // Diğer Auth Hataları
  "auth/credential-already-in-use":  "Bu kimlik bilgisi başka bir hesaba bağlı.",
  "auth/email-change-needs-verification": "E-posta değişikliği doğrulama gerektiriyor.",
  "auth/missing-email": "E-posta adresi gerekli.",
  "auth/missing-password": "Parola gerekli.",
  "auth/null-user": "Kullanıcı bulunamadı.",
  "auth/provider-already-linked": "Bu sağlayıcı zaten hesaba bağlı.",
  "auth/unverified-email":  "E-posta adresi doğrulanmamış.",
  "auth/user-mismatch": "Kimlik bilgileri bu kullanıcıyla eşleşmiyor.",
  "auth/invalid-api-key": "Geçersiz API anahtarı.",
  "auth/app-deleted": "Uygulama silindi.",
  "auth/app-not-authorized": "Uygulama yetkili değil.",
  "auth/argument-error": "Geçersiz argüman.",
  "auth/internal-error": "Dahili bir hata oluştu.  Lütfen tekrar deneyin.",
  
  // ==================== FIRESTORE HATALARI ====================
  
  // İzin Hataları
  "permission-denied": "Bu işlem için yetkiniz yok.",
  "unauthenticated":  "Oturum açmanız gerekiyor.",
  
  // Veri Hataları
  "not-found": "İstenen kayıt bulunamadı.",
  "already-exists": "Bu kayıt zaten mevcut.",
  "failed-precondition": "İşlem ön koşulları sağlanmadı.",
  "aborted": "İşlem iptal edildi.  Lütfen tekrar deneyin.",
  
  // Kaynak Hataları
  "resource-exhausted": "Kaynak limiti aşıldı. Daha sonra tekrar deneyin.",
  "cancelled":  "İşlem iptal edildi.",
  "data-loss": "Veri kaybı oluştu.",
  "unknown":  "Bilinmeyen bir hata oluştu.",
  
  // Bağlantı Hataları
  "unavailable": "Sunucu geçici olarak kullanılamıyor.  Tekrar deneyin.",
  "deadline-exceeded": "İstek zaman aşımına uğradı.",
  
  // Veri Doğrulama
  "invalid-argument": "Geçersiz veri gönderildi.",
  "out-of-range":  "Değer izin verilen aralık dışında.",
  "unimplemented": "Bu özellik henüz desteklenmiyor.",
  
  // ==================== STORAGE HATALARI ====================
  
  "storage/unknown":  "Depolama hatası oluştu.",
  "storage/object-not-found":  "Dosya bulunamadı.",
  "storage/bucket-not-found":  "Depolama alanı bulunamadı.",
  "storage/project-not-found":  "Proje bulunamadı.",
  "storage/quota-exceeded": "Depolama kotası aşıldı.",
  "storage/unauthenticated":  "Dosya yüklemek için giriş yapın.",
  "storage/unauthorized": "Bu dosyaya erişim yetkiniz yok.",
  "storage/retry-limit-exceeded": "Yükleme başarısız.  Tekrar deneyin.",
  "storage/invalid-checksum": "Dosya bozuk.  Tekrar yükleyin.",
  "storage/canceled": "Yükleme iptal edildi.",
  "storage/invalid-url": "Geçersiz dosya URL'si.",
  "storage/cannot-slice-blob": "Dosya okunamadı.",
  "storage/server-file-wrong-size": "Dosya boyutu uyuşmuyor."
};

/**
 * Firebase hata kodunu Türkçe mesaja çevirir
 * @param {Error|string} error - Firebase hatası veya hata kodu
 * @param {string} fallback - Varsayılan mesaj (opsiyonel)
 * @returns {string} Türkçe hata mesajı
 */
export function getFirebaseErrorMessage(error, fallback = "Bir hata oluştu.  Lütfen tekrar deneyin. ") {
  if (! error) return fallback;
  
  // Hata kodu al
  let code = "";
  if (typeof error === "string") {
    code = error;
  } else if (error.code) {
    code = error.code;
  } else if (error.message) {
    // Bazen hata mesajının içinde kod olabilir
    const match = error.message.match(/\(([^)]+)\)/);
    if (match) code = match[1];
  }
  
  // Firestore hataları için prefix temizle
  code = code.replace("firestore/", "").replace("Firebase:  ", "");
  
  // Hata mesajını döndür
  return firebaseErrors[code] || error.message || fallback;
}

/**
 * Switch-case için hata işleyici (eski kodlarla uyumlu)
 * @param {Error} err - Firebase hatası
 * @returns {string} Türkçe hata mesajı
 */
export function handleFirebaseError(err) {
  return getFirebaseErrorMessage(err);
}