// src/pages/ProductList.js dosyasına gidin

import React, { useState, useMemo } from 'react';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/helpers';
import { IconSearch, IconPlus, IconTrash, IconEdit } from '../components/Icons';

const ProductList = ({ 
    products, 
    categories, 
    onUpdateStock, 
    onDeleteProduct, 
    onUpdateProduct, 
    isSubscriptionActive 
}) => {
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stockModalProduct, setStockModalProduct] = useState(null); 
    const [editModalProduct, setEditModalProduct] = useState(null); 
    const [stockToAdd, setStockToAdd] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [localError, setLocalError] = useState(''); // Yerel validasyon hataları için
    
    // Düzenleme Modalındaki Form Alanları için Durumlar
    const [editedName, setEditedName] = useState('');
    const [editedPrice, setEditedPrice] = useState(0);
    const [editedCategory, setEditedCategory] = useState('');


    const filteredProducts = useMemo(() => {
        return products
          .filter(p => filterCategory === 'all' || p.category === filterCategory)
          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, filterCategory, searchTerm]);

    // Stok Güncelleme Fonksiyonu
    const handleStockUpdate = async () => {
        setLocalError('');
        if (stockToAdd <= 0) {
            setLocalError("Lütfen geçerli bir adet girin.");
            return;
        }
        try {
            await onUpdateStock(stockModalProduct, stockToAdd);
            setStockModalProduct(null);
            setStockToAdd(1);
        } catch (e) {
            // Hata App.js'te Toast olarak gösterildi.
        }
    };
    
    // Ürün Düzenleme Modalını Açma Fonksiyonu
    const handleOpenEditModal = (product) => {
        setLocalError('');
        setEditedName(product.name);
        setEditedPrice(product.price);
        setEditedCategory(product.category);
        setEditModalProduct(product);
    };
    
    // Ürün Detaylarını Kaydetme Fonksiyonu
    const handleSaveProduct = async () => {
        setLocalError('');
        if (!editedName || !editedCategory || Number(editedPrice) <= 0) {
            setLocalError("Lütfen tüm alanları geçerli değerlerle doldurun (Fiyat > 0 olmalı).");
            return;
        }

        try {
            const newData = {
                name: editedName,
                price: Number(editedPrice),
                category: editedCategory
            };
            
            await onUpdateProduct(editModalProduct.id, newData);
            
            setEditModalProduct(null); // Modalı kapat
        } catch (e) {
            // Hata App.js'te Toast olarak gösterildi.
        }
    };
    
    // Ürün Silme Fonksiyonu
    const handleDelete = async () => {
        try {
            await onDeleteProduct(confirmDelete.id);
            setConfirmDelete(null);
        } catch (e) {
            // Hata App.js'te Toast olarak gösterildi.
        }
    };

    return (
        <div className="page-container product-list-page">
            <h1 className="page-title">Stok Listesi</h1>
            
            {/* ABONELİK BİTTİYSE UYARI */}
            {!isSubscriptionActive && (
                 <div className="alert-message alert-restricted mb-4">
                    Üyelik süreniz dolduğu için **stok ve ürün bilgilerini güncelleyemezsiniz**. Yalnızca okuma modundasınız.
                </div>
            )}

            {/* ARAMA VE FİLTRE BÖLÜMÜ */}
            <div className="filter-group filter-grid">
                
                <div className="search-wrapper">
                    <input
                        type="text"
                        placeholder="Ürün adı, kategorisi veya fiyatı ile ara..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input input-search"
                    />
                    <IconSearch className="icon-search" />
                </div>
                
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="form-select select-category"
                >
                    <option value="all">Tüm Kategoriler</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Ürün Listesi Tablosu */}
            <div className="card-wrapper list-table-card">
                <div className="table-wrapper scroll-x-auto">
                    <table className="data-table stock-table">
                        <thead className="table-header table-header-light">
                            <tr className="header-row">
                                <th className="table-th">Ürün Adı</th>
                                <th className="table-th">Kategori</th>
                                <th className="table-th">Fiyat</th>
                                <th className="table-th">Stok</th>
                                <th className="table-th th-actions">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="table-body table-body-divide">
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="table-td table-td-empty">Eşleşen ürün bulunamadı.</td>
                                </tr>
                            )}
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="table-row row-hover">
                                    <td className="table-td table-td-name">{product.name}</td>
                                    <td className="table-td table-td-category">{product.category}</td>
                                    <td className="table-td table-td-price">{formatCurrency(product.price)}</td>
                                    <td className={`table-td table-td-stock ${product.stock <= 10 ? 'stock-low' : 'stock-ok'}`}>
                                        {product.stock} adet
                                    </td>
                                    <td className="table-td table-td-actions action-group">
                                        {/* YENİ DÜZENLE BUTONU */}
                                        <button
                                            onClick={() => handleOpenEditModal(product)}
                                            disabled={!isSubscriptionActive} // Kısıtlama
                                            className="btn-icon btn-edit"
                                            title={isSubscriptionActive ? "Ürünü Düzenle" : "Üyelik Gerekli"}
                                        >
                                            <IconEdit /> 
                                        </button>
                                        {/* STOK EKLE BUTONU */}
                                        <button
                                            onClick={() => { setStockModalProduct(product); setStockToAdd(1); }}
                                            disabled={!isSubscriptionActive} // Kısıtlama
                                            className="btn-icon btn-add-stock"
                                            title={isSubscriptionActive ? "Stok Ekle" : "Üyelik Gerekli"}
                                        >
                                            <IconPlus />
                                        </button>
                                        {/* SİL BUTONU */}
                                        <button
                                            onClick={() => setConfirmDelete(product)}
                                            disabled={!isSubscriptionActive} // Kısıtlama
                                            className="btn-icon btn-delete"
                                            title={isSubscriptionActive ? "Ürünü Sil" : "Üyelik Gerekli"}
                                        >
                                            <IconTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* STOK EKLEME MODALI */}
            <Modal 
                show={!!stockModalProduct} 
                onClose={() => setStockModalProduct(null)}
                title={`"${stockModalProduct?.name}" için Stok Ekle`}
            >
                {localError && <div className="alert-message alert-error">{localError}</div>}
                <div className="modal-content-group">
                    <p className="modal-text modal-current-stock">
                        Mevcut Stok: <span className="stock-count-value">{stockModalProduct?.stock}</span> adet
                    </p>
                    <div className="form-group">
                        <label htmlFor='stockToAdd' className="form-label">Eklenecek Adet:</label>
                        <input
                            id="stockToAdd"
                            type="number"
                            min="1"
                            value={stockToAdd}
                            onChange={(e) => setStockToAdd(Number(e.target.value))}
                            className="form-input"
                        />
                    </div>
                    <button
                        onClick={handleStockUpdate}
                        className="btn btn-primary btn-full"
                    >
                        Stoğu Güncelle
                    </button>
                </div>
            </Modal>

            {/* ÜRÜN DÜZENLEME MODALI */}
            <Modal
                show={!!editModalProduct}
                onClose={() => setEditModalProduct(null)}
                title={`"${editModalProduct?.name}" Düzenle`}
            >
                {localError && <div className="alert-message alert-error">{localError}</div>}
                <div className="modal-content-group space-y-4">
                    
                    <div className="form-group">
                        <label htmlFor="editName" className="form-label">Ürün Adı</label>
                        <input
                            id="editName"
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="editPrice" className="form-label">Fiyat (TL)</label>
                        <input
                            id="editPrice"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editedPrice}
                            onChange={(e) => setEditedPrice(Number(e.target.value))}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="editCategory" className="form-label">Kategori</label>
                        <select
                            id="editCategory"
                            value={editedCategory}
                            onChange={(e) => setEditedCategory(e.target.value)}
                            className="form-select"
                        >
                            <option value="">Kategori Seçin</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSaveProduct}
                        className="btn btn-success btn-full"
                    >
                        Kaydet
                    </button>
                </div>
            </Modal>
<Modal 
                show={!!confirmDelete} 
                onClose={() => setConfirmDelete(null)}
                title="Ürünü Sil"
            >
                <div className="modal-content-group modal-delete-content">
                    <p className="modal-text modal-delete-warning">
                        <span className="text-warning-bold">{confirmDelete?.name}</span> adlı ürünü silmek istediğinizden emin misiniz? 
                        Bu işlem geri alınamaz.
                    </p>
                    <div className="modal-actions action-group-right">
                        <button
                            onClick={() => setConfirmDelete(null)}
                            className="btn btn-secondary btn-cancel"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn btn-danger btn-confirm-delete"
                        >
                            Sil
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProductList;