import React, { useState } from 'react';
// isSubscriptionActive prop'unu alabilmek için bileşen tanımını güncelledik.

const CategoryManager = ({ categories, onAddCategory, isSubscriptionActive }) => {
    // Eski error/success state'leri kaldırıldı
    const [newCategory, setNewCategory] = useState('');
    const [localError, setLocalError] = useState(''); // <-- Yerel form validasyonu için

    const handleSubmit = async (e) => { // async hale getirildi
        e.preventDefault();
        setLocalError(''); // Her submit'te yerel hatayı temizle

        // 1. Yerel Form Validasyonu
        if (!newCategory) {
            setLocalError('Kategori adı boş olamaz.');
            return;
        }

        if (categories.find(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
            setLocalError('Bu kategori zaten mevcut.');
            return;
        }

        try {
            // onAddCategory hook'u (App.js'te) abonelik kontrolünü yapar ve Toast'ı tetikler
            await onAddCategory(newCategory);
            
            // Başarılı işlem sonrası formu temizle
            setNewCategory('');

        } catch (e) {
            // App.js'ten gelen hatalar (Abonelik Kısıtlaması, API hatası) Toast olarak gösterilir.
        }
    };

    return (
        <div className="page-container max-w-lg mx-auto">
            <h1 className="page-title">Kategorileri Yönet</h1>
            
            {/* ABONELİK DURUMU UYARISI */}
            {!isSubscriptionActive && (
                 <div className="alert-message alert-restricted mb-4">
                    Üyelik süreniz dolduğu için **yeni kategori ekleyemezsiniz**. Lütfen üyeliğinizi yenileyin.
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-card form-category-add">
                <h2 className="card-title">Yeni Kategori Ekle</h2>
                
                {/* YEREL HATA UYARISI */}
                {localError && <div className="alert-message alert-error mb-4">{localError}</div>}
                
                <div className="form-grid grid-gap-4">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Yeni Kategori Adı"
                        disabled={!isSubscriptionActive} // Kısıtlama
                        className="form-input flex-grow"
                    />
                    <button
                        type="submit"
                        disabled={!isSubscriptionActive} // Kısıtlama
                        className="btn btn-primary btn-submit"
                    >
                        {isSubscriptionActive ? 'Ekle' : 'Üyelik Gerekiyor'}
                    </button>
                </div>
            </form>

            <div className="card-list-wrapper">
                <h2 className="card-title">Mevcut Kategoriler</h2>
                {categories.length === 0 ? (
                    <p className="text-muted">Henüz kategori eklenmemiş.</p>
                ) : (
                    <ul className="list-group">
                        {categories.map(category => (
                            <li
                                key={category.id}
                                className="list-item list-item-category"
                            >
                                <span className="item-name">{category.name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CategoryManager;