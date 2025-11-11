import React, { useState } from 'react';
import { formatDate } from '../utils/helpers';
import { IconLoader } from '../components/Icons';

// Note: removed unused 'activateLicense' import to fix eslint no-unused-vars warning

const SubscriptionPage = ({ userId, userProfile, isSubscriptionActive, onActivateLicense }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const subscriptionEndDate = userProfile?.subscriptionEndDate?.toDate ?
        userProfile.subscriptionEndDate.toDate() :
        null;

    const formatLicenseKey = (value) => {
        const cleaned = value.replace(/[^A-Z0-9]/g, '');
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
            const cleanKey = licenseKey.replace(/-/g, '');
            await onActivateLicense(cleanKey);
            setLicenseKey('');
        } catch (error) {
            // Hata yönetimi App.js tarafından Toast ile yapılır
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

            <form onSubmit={handleActivation} className="form-card form-activation">
                <h2 className="card-title form-title">Ürün Anahtarı Aktivasyonu</h2>

                <div className="form-group">
                    <label htmlFor="licenseKey" className="form-label">Ürün Lisans Anahtarı</label>
                    <input
                        id="licenseKey"
                        type="text"
                        value={licenseKey}
                        onChange={handleLicenseChange}
                        placeholder="PREM-XXXX-XXXX-XXXX"
                        required
                        className="form-input"
                        maxLength={24}
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
