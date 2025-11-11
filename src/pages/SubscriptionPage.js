// src/pages/SubscriptionPage.js dosyasına gidin

import React, { useState } from 'react';
import { activateLicense } from '../utils/api'; 
import { formatDate } from '../utils/helpers';
import { IconLoader } from '../components/Icons'; 

const SubscriptionPage = ({ userId, userProfile, isSubscriptionActive, onActivateLicense }) => { 
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Abonelik Bitiş Tarihini Düzgün Formatlama
    const subscriptionEndDate = userProfile?.subscriptionEndDate?.toDate ? 
                                userProfile.subscriptionEndDate.toDate() : 
                                null;

    // Lisans anahtarını formatla: Her 4 karakterde bir tire ekle
    const formatLicenseKey = (value) => {
        // Sadece harf ve rakamları al, boşluk ve tire gibi karakterleri kaldır
        const cleaned = value.replace(/[^A-Z0-9]/g, '');
        
        // Her 4 karakterde bir tire ekle
        const formatted = cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
        
        return formatted;
    };

    const handleLicenseChange = (e) => {
        const value = e.target.value.toUpperCase();
        const formatted = formatLicenseKey(value);
        setLicenseKey(formatted);
    };

    const handleActivation = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!licenseKey) {
            setIsLoading(false);
            return;
        }

        try {
            // Tireleri kaldırarak backend'e gönder
            const cleanKey = licenseKey.replace(/-/g, '');
            await onActivateLicense(cleanKey); 

            // Başarılıysa formu temizle
            setLicenseKey('');
            
        } catch (error) {
            // Hata mesajı App.js Hook'u tarafından Toast olarak gösterilir.
        } finally {
            setIsLoading(false);
        }
    };

    const isTrial = userProfile?.subscriptionStatus === 'trial';
    const currentStatusText = isSubscriptionActive 
        ? (isTrial ? 'DENEME SÜRÜMÜ (Aktif)' : 'PREMIUM (Aktif)') 
        : 'STANDART (Sona Erdi)';

    return (
        <div className="page-container subscription-page-grid">
            <h1 className="page-title">Üyelik ve Lisans Yönetimi</h1>

            {/* MEVCUT DURUM KARTI */}
            <div className="card-wrapper status-card-wrapper">
                <div className="summary-card status-card">
                    <h2 className="card-title status-title">Mevcut Üyelik Durumu</h2>
                    <p className="card-text status-text">
                        Kullanıcı Adı: {userProfile?.displayName || userProfile?.email}
                    </p>
                    <p className="card-text status-row">
                        Durum: <span className={`status-badge ${isSubscriptionActive ? 'badge-active' : 'badge-free'}`}>
                            {currentStatusText}
                        </span>
                    </p>
                    {subscriptionEndDate ? (
                        <p className="card-text end-date-text">
                            Bitiş Tarihi: {formatDate(subscriptionEndDate)}
                        </p>
                    ) : (
                        <p className="card-text end-date-text">
                            Aktif bir Premium aboneliğiniz bulunmamaktadır.
                        </p>
                    )}
                </div>
            </div>

            {/* LİSANS AKTİVASYON FORMU */}
            <form onSubmit={handleActivation} className="form-card form-activation">
                <h2 className="card-title form-title">Ürün Anahtarı Aktivasyonu</h2>

                <div className="form-group">
                    <label htmlFor="licenseKey" className="form-label">Ürün Lisans Anahtarı</label>
                    <input
                        id="licenseKey"
                        type="text"
                        value={licenseKey}
                        onChange={handleLicenseChange}
                        placeholder="ABCD-EFGH-IJKL-MNOP"
                        required
                        className="form-input"
                        maxLength={24} // 20 karakter + 4 tire = 24
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !userId}
                    className="btn btn-primary btn-full"
                >
                    {isLoading ? <IconLoader width="24" height="24" className="icon-loader" /> : 'Anahtarı Aktive Et'}
                </button>
            </form>
        </div>
    );
};

export default SubscriptionPage;