"use client";

import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { usePathname } from "next/navigation";
import { getUserProfile, updateUserProfile } from "../utils/firebaseHelpers";
import { FiCheckCircle, FiLock } from "react-icons/fi";

const TermsModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = getAuth();
  const pathname = usePathname();

  const EXCLUDED_PATHS = ["/privacy-policy", "/terms-of-service"];

  useEffect(() => {
    if (EXCLUDED_PATHS.includes(pathname)) {
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
  }, [auth, pathname]);

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

  if (loading || !showModal || EXCLUDED_PATHS.includes(pathname)) return null;

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
