// src/components/EmailVerificationScreen.js

import React, { useState } from 'react';
import { auth, sendEmailVerification } from '../utils/firebase';
import { toast } from 'react-toastify';

const EmailVerificationScreen = ({ userEmail }) => {
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        setIsResending(true);
        try {
            await sendEmailVerification(auth.currentUser);
            toast.info('Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        } catch (e) {
            toast.error('E-posta gönderimi başarısız oldu: ' + e.message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card verification-card">
                <h1 className="auth-title title-danger">E-posta Doğrulama Gerekiyor</h1>
                
                <p className="verification-message">
                    Hesabınızı kullanmaya başlamak için lütfen **{userEmail}** adresine gönderdiğimiz doğrulama linkine tıklayın.
                </p>
                <p className="verification-instruction">
                    Linke tıkladıktan sonra sayfayı yenileyiniz.
                </p>
                
                <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="btn btn-warning btn-full"
                >
                    {isResending ? 'Tekrar Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
                </button>
                
                <button
                    onClick={() => auth.signOut()}
                    className="btn btn-secondary btn-full mt-2"
                >
                    Farklı Hesapla Giriş Yap
                </button>
            </div>
        </div>
    );
};

export default EmailVerificationScreen;