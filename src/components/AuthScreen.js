import React, { useState } from 'react';
import { 
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from '../utils/firebase'; 
import { IconLoader } from '../components/Icons';
import { createOrUpdateUserProfile } from '../utils/api';

const AuthScreen = ({ onSwitchToHome }) => { 
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false); 

  const provider = new GoogleAuthProvider();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      if (isRegistering && !displayName) {
        setError('Lütfen görünen adınızı girin.');
        setIsLoading(false);
        return;
      }

      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user); 
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      await createOrUpdateUserProfile(user.uid, user.email, user.displayName); 
      // Başarılı giriş/kayıt sonrası ana sayfaya geçiş
      if (onSwitchToHome) onSwitchToHome();

    } catch (e) {
      if (e.code === 'auth/wrong-password') {
        setError('E-posta veya şifre hatalı.');
      } else if (e.code === 'auth/user-not-found') {
        setError('Bu e-postaya kayıtlı kullanıcı bulunamadı.');
      } else if (e.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanılıyor.');
      } else {
        setError(e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'); 
    } catch (e) {
      setInfo('Şifre sıfırlama talebiniz işlenmiştir. E-posta adresinizi kontrol edin.');
    } finally {
      setIsLoading(false);
      setIsResetting(false);
      setEmail('');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
      }
      await createOrUpdateUserProfile(user.uid, user.email, user.displayName);
      if (onSwitchToHome) onSwitchToHome();
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h1 className="auth-main-title">
          StokPro {isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
        </h1>
        {error && <div className="auth-alert auth-error">{error}</div>}
        {info && <div className="auth-alert auth-info">{info}</div>}
        {isResetting ? (
          <form onSubmit={handlePasswordReset} className="auth-form">
            <div className="auth-group">
              <label htmlFor="reset-email" className="auth-label">E-posta Adresi</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <button type="submit" disabled={isLoading} className="auth-btn auth-btn-primary">
              {isLoading ? <IconLoader size={24} className="icon-loader" /> : "Şifre Sıfırla"}
            </button>
            <button type="button" disabled={isLoading} className="auth-btn auth-btn-link" onClick={() => setIsResetting(false)}>
              Geri Dön
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuth} className="auth-form">
              {isRegistering && (
                <div className="auth-group">
                  <label htmlFor="displayname" className="auth-label">Görünen Ad</label>
                  <input
                    id="displayname"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              )}
              <div className="auth-group">
                <label htmlFor="email" className="auth-label">E-posta</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              <div className="auth-group">
                <label htmlFor="password" className="auth-label">Şifre</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
              {!isRegistering && (
                <div className="auth-group">
                  <button
                    type="button"
                    className="auth-btn auth-btn-link"
                    disabled={isLoading}
                    onClick={() => {
                      setIsResetting(true);
                      setError('');
                      setInfo('');
                    }}
                  >Şifreni mi unuttun?</button>
                </div>
              )}
              <button type="submit" disabled={isLoading} className="auth-btn auth-btn-primary">
                {isLoading
                  ? <IconLoader size={24} className="icon-loader" />
                  : (isRegistering ? 'Kayıt Ol' : 'Giriş Yap')}
              </button>
            </form>
            <div className="auth-divider">
              <hr />
              <span>VEYA</span>
              <hr />
            </div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="auth-btn auth-btn-google"
            >
              Google ile Giriş Yap
            </button>
            <div className="auth-switch-row">
              <span>
                {isRegistering ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
              </span>
              <button
                onClick={() => {
                  // Kayıt modundan çıkarken ana sayfaya dön
                  if (isRegistering && onSwitchToHome) {
                    onSwitchToHome();
                    return;
                  }
                  setIsRegistering(!isRegistering);
                  setError('');
                  setInfo('');
                }}
                className="auth-btn auth-btn-switch"
                disabled={isLoading}
              >
                {isRegistering ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;