import React, { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

const AddProduct = ({ categories, onAddProduct, onAddCategory, isSubscriptionActive }) => {
    // Eski error/success state'leri kaldırıldı
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [price, setPrice] = useState(0);
    const [stock, setStock] = useState(0);
    const [localError, setLocalError] = useState(''); // <-- Yerel form validasyonu için

    const handleSubmit = async (e) => { // Async hale getirildi
        e.preventDefault();
        setLocalError('');

        // Abonelik kontrolü App.js'teki Hook'ta yapıldığı için,
        // burada sadece form validasyonunu yapıyoruz.
        
        const selectedCategory = category === 'new' ? newCategory : category;

        if (!name || !selectedCategory || Number(price) <= 0 || Number(stock) < 0) {
            setLocalError('Lütfen tüm alanları doğru bir şekilde doldurun (Fiyat 0\'dan büyük, stok 0 veya daha fazla olmalı).');
            return;
        }

        try {
            const product = {
                name,
                category: selectedCategory,
                price: Number(price),
                stock: Number(stock)
            };
            
            // onAddProduct App.js'teki kısıtlama kontrolünden geçer ve Toast'ı tetikler
            await onAddProduct(product); 

            // Yeni kategori ekleme (onAddCategory de Toast tetikleyebilir)
            if (category === 'new' && !categories.find(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
                await onAddCategory(newCategory);
            }
            
            // Başarılı işlem sonrası formu temizle
            setName('');
            setCategory('');
            setNewCategory('');
            setPrice(0);
            setStock(0);

        } catch (e) {
            // Hata Toast'ta göründüğü için burada ekrana bir şey basmaya gerek yok.
        }
    };

    return (
        <div className="page-container max-w-lg mx-auto">
            <h1 className="page-title">Yeni Ürün Ekle</h1>
            
            {/* ABONELİK DURUMU UYARISI */}
            {!isSubscriptionActive && (
                 <div className="alert-message alert-restricted mb-4">
                    Üyelik süreniz dolduğu için **yeni ürün ekleyemezsiniz**. Lütfen üyeliğinizi yenileyin.
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-card form-product-add">
                
                {/* YEREL HATA UYARISI */}
                {localError && <div className="alert-message alert-error">{localError}</div>}

                {/* Ürün Adı */}
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Ürün Adı</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        // Abonelik bitince devre dışı bırak
                        disabled={!isSubscriptionActive}
                        className="form-input"
                    />
                </div>

                {/* Kategori */}
                <div className="form-group">
                    <label htmlFor="category" className="form-label">Kategori</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        // Abonelik bitince devre dışı bırak
                        disabled={!isSubscriptionActive}
                        className="form-select"
                    >
                        <option value="">Kategori Seçin</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="new">--- Yeni Kategori Ekle ---</option>
                    </select>
                </div>

                {/* Yeni Kategori Alanı */}
                {category === 'new' && (
                    <div className="form-group">
                        <label htmlFor="newCategory" className="form-label">Yeni Kategori Adı</label>
                        <input
                            id="newCategory"
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            // Abonelik bitince devre dışı bırak
                            disabled={!isSubscriptionActive}
                            className="form-input"
                        />
                    </div>
                )}

                {/* Fiyat ve Stok */}
                <div className="form-grid grid-2">
                    <div className="form-group">
                        <label htmlFor="price" className="form-label">Birim Fiyat (TL)</label>
                        <input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            // Abonelik bitince devre dışı bırak
                            disabled={!isSubscriptionActive}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="stock" className="form-label">Başlangıç Stoğu</label>
                        <input
                            id="stock"
                            type="number"
                            min="0"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            // Abonelik bitince devre dışı bırak
                            disabled={!isSubscriptionActive}
                            className="form-input"
                        />
                    </div>
                </div>

                {/* Gönder Butonu */}
                <div className="form-group">
                    <button
                        type="submit"
                        disabled={!isSubscriptionActive}
                        className="btn btn-primary btn-full"
                    >
                        {isSubscriptionActive ? 'Ürünü Kaydet' : 'Üyelik Gerekiyor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;