import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "../utils/firebaseHelpers";
import { FiCheckCircle, FiLock } from "react-icons/fi"; // FiFileText kaldırıldı kullanılmıyor diye
import "../styles/TermsModal.css";

const TermsModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Checkbox durumları
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    // Firebase Auth durumunu dinliyoruz (Düzeltme burada yapıldı)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        console.log("TermsModal: Kullanıcı giriş yapmamış, modal gösterilmiyor.");
        setLoading(false);
        return;
      }

      console.log("TermsModal: Kullanıcı algılandı:", currentUser.uid);

      try {
        const profile = await getUserProfile(currentUser.uid);
        console.log("TermsModal: Profil verisi çekildi:", profile);
        
        // Eğer profil hiç yoksa (yeni kullanıcı) VEYA termsAccepted true değilse
        if (!profile || profile.termsAccepted !== true) {
          console.log("TermsModal: Onay eksik, modal açılıyor...");
          setShowModal(true);
        } else {
          console.log("TermsModal: Kullanıcı daha önce onaylamış.");
        }
      } catch (error) {
        console.error("TermsModal Hatası:", error);
        // Hata durumunda güvenlik için modalı açabilirsin veya loglayabilirsin
      } finally {
        setLoading(false);
      }
    });

    // Component unmount olduğunda dinleyiciyi kapat
    return () => unsubscribe();
  }, [auth]);

  const handleConfirm = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSubmitting(true);

    try {
      // DB'ye kaydet
      await updateUserProfile(user.uid, {
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        privacyAccepted: true
      });

      console.log("TermsModal: Onay veritabanına işlendi.");

      // Modalı kapat
      setShowModal(false);
      // Opsiyonel: Sayfayı yenilemeye gerek yok ama state güncellendiği için modal kapanır.
    } catch (error) {
      console.error("TermsModal Kayıt Hatası:", error);
      alert("Bir hata oluştu: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eğer yükleniyorsa veya modal kapalıysa hiçbir şey gösterme
  if (loading || !showModal) return null;

  return (
    <div className="terms-overlay">
      <div className="terms-modal">
        <div className="terms-header">
          <div className="icon-wrapper">
            <FiLock />
          </div>
          <h2>Hizmet Güncellemesi</h2>
          <p>
            StokPro'yu kullanmaya devam etmek için lütfen güncellenen şartları inceleyip onaylayın.
          </p>
        </div>

        <div className="terms-body">
          {/* Checkbox 1: Hizmet Şartları */}
          <label className={`terms-option ${termsAccepted ? "active" : ""}`}>
            <input 
              type="checkbox" 
              checked={termsAccepted} 
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="checkbox-custom">
              {termsAccepted && <FiCheckCircle />}
            </span>
            <span className="text">
              <a href="/terms-of-service" target="_blank" rel="noreferrer">Hizmet Şartları</a>'nı okudum ve kabul ediyorum.
            </span>
          </label>

          {/* Checkbox 2: Gizlilik Politikası */}
          <label className={`terms-option ${privacyAccepted ? "active" : ""}`}>
            <input 
              type="checkbox" 
              checked={privacyAccepted} 
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />
            <span className="checkbox-custom">
              {privacyAccepted && <FiCheckCircle />}
            </span>
            <span className="text">
              <a href="/privacy-policy" target="_blank" rel="noreferrer">Gizlilik Politikası</a>'nı okudum ve verilerimin işlenmesini onaylıyorum.
            </span>
          </label>
        </div>

        <div className="terms-footer">
          <button 
            className="confirm-btn" 
            disabled={!termsAccepted || !privacyAccepted || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? "Kaydediliyor..." : "Onayla ve Devam Et"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
