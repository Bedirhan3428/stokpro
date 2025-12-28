import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, sendEmailVerification, applyActionCode, signOut } from "firebase/auth";

export default function VerifyEmail() {
  const auth = getAuth();
  const nav = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    async function handleOob() {
      if (mode !== "verifyEmail" || !oobCode) return;
      setLoading(true);
      setStatus({ type: "info", msg: "Doğrulama işleniyor..." });
      try {
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            const dest = (location.state && location.state.from?.pathname) || "/dashboard";
            setStatus({ type: "success", msg: "E-posta doğrulandı, yönlendiriliyorsunuz..." });
            setTimeout(() => nav(dest, { replace: true }), 800);
            return;
          }
        }
        setStatus({ type: "success", msg: "E-posta doğrulandı. Giriş yaptıktan sonra devam edebilirsiniz." });
      } catch (err) {
        setStatus({ type: "error", msg: err.message || "Doğrulama kodu işlenemedi." });
      } finally {
        setLoading(false);
      }
    }

    handleOob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function resend() {
    if (!user) return;
    setStatus(null);
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: "https://www.stokpro.shop/verify-email",
        handleCodeInApp: true
      };
      await sendEmailVerification(user, actionCodeSettings);
      setStatus({ type: "success", msg: "Doğrulama e-postası tekrar gönderildi." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "E-posta gönderilemedi." });
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    if (!user) return;
    setLoading(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        const dest = (location.state && location.state.from?.pathname) || "/dashboard";
        nav(dest, { replace: true });
      } else {
        setStatus({ type: "info", msg: "Henüz doğrulanmadı. Lütfen e-postanızı kontrol edin." });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Durum yenilenemedi." });
    } finally {
      setLoading(false);
    }
  }

  // --- ÇIKIŞ YAP VE KAYIT EKRANINA GİT ---
  async function cikisVeYonlendir() {
    setLoading(true);
    try {
      await signOut(auth);
      nav("/register", { replace: true });
    } catch (err) {
      console.error("Çıkış hatası:", err);
      nav("/register", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-sayfa">
      <style>{`
        .fp-sayfa {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-page, #f3f4f6);
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }
        .fp-kapsul {
          background: var(--card, #ffffff);
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          max-width: 480px;
          width: 100%;
          text-align: center;
          border: 1px solid var(--border, #e5e7eb);
        }
        .fp-baslik {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text, #111827);
          margin-bottom: 8px;
        }
        .fp-alt {
          color: var(--subtext, #6b7280);
          font-size: 0.95rem;
          margin-bottom: 24px;
        }
        .fp-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fp-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--bg, #f9fafb);
          color: var(--text, #374151);
          transition: all 0.2s;
        }
        .fp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(0.98);
        }
        .fp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .fp-btn-mavi {
          background: #2563eb;
          color: white;
          border: none;
        }
        .fp-btn-mavi:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .fp-btn-kirmizi {
          background: #fff1f2;
          color: #e11d48;
          border-color: #fecdd3;
        }
        .fp-btn-kirmizi:hover:not(:disabled) {
          background: #ffe4e6;
        }
        .fp-durum {
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-top: 10px;
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #dbeafe;
        }
        .fp-hata {
          background: #fef2f2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .fp-basarili {
          background: #f0fdf4;
          color: #166534;
          border-color: #bbf7d0;
        }
        .fp-mini {
          font-size: 0.8rem;
          color: var(--subtext, #9ca3af);
          margin-top: 20px;
        }
      `}</style>

      <div className="fp-kapsul">
        <h3 className="fp-baslik">E-posta Doğrulama</h3>
        <p className="fp-alt">
          {user?.email ? `Hesap: ${user.email}` : "Oturum bulunamadı. Lütfen tekrar giriş yapın."}
        </p>

        <div className="fp-form">
          <button className="fp-btn fp-btn-mavi" onClick={resend} disabled={loading || !user}>
            {loading ? "Gönderiliyor..." : "Doğrulama E-postasını Gönder"}
          </button>

          <button className="fp-btn" onClick={refreshStatus} disabled={loading || !user}>
            {loading ? "Yenileniyor..." : "Doğrulama Durumunu Yenile"}
          </button>

          {/* ÇIKIŞ YAP BUTONU */}
          <button 
            className="fp-btn fp-btn-kirmizi" 
            onClick={cikisVeYonlendir}
            disabled={loading}
          >
            Çıkış Yap / Kayıt Ekranına Dön
          </button>

          {status && (
            <div className={`fp-durum ${status.type === "error" ? "fp-hata" : status.type === "success" ? "fp-basarili" : ""}`}>
              {status.msg}
            </div>
          )}
        </div>

        <div className="fp-mini">
          Doğrulama maili gelmediyse spam / gereksiz klasörünü kontrol edin.
        </div>
      </div>
    </div>
  );
}


