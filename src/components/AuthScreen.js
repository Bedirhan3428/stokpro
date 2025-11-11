import React, { useState } from 'react';
import { 
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  // KRİTİK İMPORT
  sendEmailVerification 
} from '../utils/firebase'; 
import { IconLoader } from './Icons';
import { createOrUpdateUserProfile } from '../utils/api';

const AuthScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const provider = new GoogleAuthProvider();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering && !displayName) {
          setError('Lütfen görünen adınızı girin.');
          setIsLoading(false);
          return;
      }

      let userCredential;
      if (isRegistering) {
        // 1. KAYIT İŞLEMİ
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await updateProfile(userCredential.user, {
            displayName: displayName
        });
        
        // 2. E-POSTA DOĞRULAMASI GÖNDER
        // Yeni kayıt olan kullanıcıya doğrulama maili yolla
        await sendEmailVerification(userCredential.user); 

      } else {
        // GİRİŞ İŞLEMİ
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      // 3. Profil Kayıt: E-posta ile giriş yapanlar için
      const user = userCredential.user;
      await createOrUpdateUserProfile(user.uid, user.email, user.displayName); 

    } catch (e) {
        setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      
      const user = result.user;
      
      // Google Auth'ta e-posta zaten doğrulanmış olabilir, ama emin olalım
      if (user && !user.emailVerified) {
          // Eğer Google hesabı doğrulanmadıysa (çok nadir), gönder
          await sendEmailVerification(user); 
      }
      
      // Profil Kayıt: Google ile giriş yapanlar için
      await createOrUpdateUserProfile(user.uid, user.email, user.displayName); 

    } catch (e) {
        setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">
          StokPro {isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
        </h1>
        
        {/* Hata Uyarısı */}
        {error && <div className="alert-message alert-error auth-alert">{error}</div>}

        <form onSubmit={handleAuth} className="auth-form">

        {isRegistering && (
             <div className="form-group">
                <label htmlFor="displayname" className="form-label">Görünen Ad</label>
                <input
                  id="displayname"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isRegistering} 
                  className="form-input"
                />
             </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">E-posta</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-full auth-btn"
          >
            {isLoading 
                ? <IconLoader size={24} className="icon-loader-white" /> 
                : (isRegistering ? 'Kayıt Ol' : 'Giriş Yap')
            }
          </button>
        </form>
        
        {/* Google Giriş Butonu */}
        <div className="divider-row">
          <hr className="divider-line" />
          <span className="divider-text">VEYVA</span>
          <hr className="divider-line" />
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="btn btn-danger btn-full google-btn"
        >
          Google ile Giriş Yap
        </button>

        <p className="auth-switch-text">
          {isRegistering ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
          <button
            onClick={() => {
                setIsRegistering(!isRegistering);
                setError(''); // Mod değiştirince hatayı temizle
            }}
            className="auth-switch-button"
            disabled={isLoading}
          >
            {isRegistering ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;