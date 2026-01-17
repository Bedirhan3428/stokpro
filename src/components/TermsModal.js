import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "../utils/firebaseHelpers"; // Dosya yolunu kendine göre ayarla
import { FiCheckCircle, FiFileText, FiLock } from "react-icons/fi";
import "../styles/TermsModal.css"; // CSS dosyasını aşağıda vereceğim

const TermsModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Checkbox durumları
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const checkUserTerms = async () => {
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);
        
        // Eğer profil yoksa veya termsAccepted true değilse modalı göster
        if (!profile || !profile.termsAccepted) {
          setShowModal(true);
        }
      } catch (error) {
        console.error("Profil kontrol hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserTerms();
  }, [user]);

  const handleConfirm = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // DB'ye kaydet
      await updateUserProfile(user.uid, {
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        privacyAccepted: true
      });

      // Modalı kapat
      setShowModal(false);
      alert("Teşekkürler, onayın başarıyla alındı.");
    } catch (error) {
      console.error("Onay hatası:", error);
      alert("Bir hata oluştu, lütfen tekrar dene.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal || !user) return null;

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
