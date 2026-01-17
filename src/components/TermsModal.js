import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useLocation } from "react-router-dom"; // <-- YENİ: Konum kontrolü için
import { getUserProfile, updateUserProfile } from "../utils/firebaseHelpers";
import { FiCheckCircle, FiLock } from "react-icons/fi";
import "../styles/TermsModal.css";

const TermsModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Checkbox durumları
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = getAuth();
  const location = useLocation(); // <-- YENİ: Şu anki sayfayı al

  // Modalın görünmemesi gereken sayfalar (Kullanıcı bunları okumaya çalışıyor olabilir)
  const EXCLUDED_PATHS = ["/privacy-policy", "/terms-of-service"];

  useEffect(() => {
    // Eğer kullanıcı yasal sayfalardaysa modalı hiç tetikleme
    if (EXCLUDED_PATHS.includes(location.pathname)) {
      setShowModal(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        
        // Onaylanmamışsa göster
        if (!profile || profile.termsAccepted !== true) {
          setShowModal(true);
        }
      } catch (error) {
        console.error("TermsModal Hatası:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, location.pathname]); // location.pathname değiştiğinde tekrar kontrol et

  const handleConfirm = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSubmitting(true);

    try {
      await updateUserProfile(user.uid, {
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        privacyAccepted: true
      });

      setShowModal(false);
      setTermsAccepted(true);
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      alert("Hata: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Yasal sayfalardaysak veya yükleniyorsa gösterme
  if (loading || !showModal || EXCLUDED_PATHS.includes(location.pathname)) return null;

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
              {/* target="_blank" ile yeni sekmede açıyoruz ama garanti olsun diye location kontrolü de koyduk */}
              <a href="/terms-of-service" target="_blank" rel="noreferrer">Hizmet Şartları</a>'nı okudum ve kabul ediyorum.
            </span>
          </label>

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
