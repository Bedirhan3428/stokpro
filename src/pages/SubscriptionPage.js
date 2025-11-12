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
                        placeholder="ABCD-EFGH-IJKL-MNOP"
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
                <h4>Ürün Anahtarını aktive ettikten sonra sayfayı yenileyiniz.</h4>
                <h4>Eğer PREMIUM Üyeliğniz varken tekrar anahtar aktive ederseniz Mevcut sürenizin üzerine eklenir.</h4>
                <p>🔑 Ürün Anahtarı Satışı Hakkında Önemli Bilgilendirme
                    <br/>
Değerli müşterilerimiz,

Şu an için vergi mükellefiyeti kaydımız bulunmadığından dolayı, yasal mevzuat gereği ürün anahtarlarımızın doğrudan bu web sitesi üzerinden satışını gerçekleştiremiyoruz.

Bu nedenle, sizlerin güvenli bir şekilde alışveriş yapabilmesi ve ödeme işlemlerinin sorunsuz ilerlemesi için ürün anahtarlarımızı yalnızca Bynogame platformu üzerinden satışa sunmaktayız.

Ürün Anahtarlarımız İçin Lütfen Bynogame Sayfamızı Ziyaret Edin:

<a href="https://www.bynogame.com/tr/account/selling?game=Pazar&status=active" target="_blank" rel="noopener noreferrer"> ByNoGame Ürün anahtarı LİNK</a>
<br/>
Anlayışınız için teşekkür eder, keyifli oyunlar dileriz!</p>
                
            </form>
            <div>
               
            </div>

        </div>
    );
};

export default SubscriptionPage;