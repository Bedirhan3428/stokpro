import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/helpers';
import { IconSearch, IconPlus, IconMinus, IconTrash, IconLoader } from '../components/Icons';
import '../css/Sales.css';

const Sales = ({ products, onMakeSale, isSubscriptionActive }) => { // <-- isSubscriptionActive prop'u eklendi
    const [cart, setCart] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [localError, setLocalError] = useState(''); // <-- Yerel hata state'i eklendi

    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const searchableProducts = useMemo(() => {
        if (!products) return [];
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return products.filter(p =>
          p.stock > 0 &&
          (p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            p.category.toLowerCase().includes(lowerCaseSearchTerm))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [products, searchTerm]);

    const selectedProduct = useMemo(() =>
        searchableProducts.find(p => p.id === selectedProductId),
        [searchableProducts, selectedProductId]
    );

    const cartTotal = useMemo(() =>
        cart.reduce((total, item) => total + item.price * item.quantity, 0),
        [cart]
    );

    const handleAddToCart = (e) => {
        e.preventDefault();
        setLocalError(''); // Yerel hatayı temizle

        if (!selectedProduct) {
            setLocalError('Lütfen bir ürün seçin.');
            return;
        }
        if (quantity <= 0) {
            setLocalError('Adet 0\'dan büyük olmalıdır.');
            return;
        }

        const currentStock = selectedProduct.stock;
        const existingCartItem = cart.find(item => item.id === selectedProduct.id);
        const cartQuantity = existingCartItem ? existingCartItem.quantity : 0;

        const newTotalQuantity = cartQuantity + quantity;

        if (newTotalQuantity > currentStock) {
            setLocalError(`Sepetteki ürün adedi, mevcut stok (${currentStock}) miktarını aşıyor.`);
            return;
        }

        if (existingCartItem) {
            setCart(cart.map(item =>
                item.id === selectedProduct.id
                  ? { ...item, quantity: newTotalQuantity }
                  : item
            ));
        } else {
            setCart([...cart, {
                id: selectedProduct.id,
                name: selectedProduct.name,
                category: selectedProduct.category,
                price: selectedProduct.price,
                quantity: quantity,
            }]);
        }

        setSelectedProductId('');
        setQuantity(1);
        setSearchTerm('');
    };

    const handleRemoveFromCart = (itemId) => {
        setCart(cart.filter(item => item.id !== itemId));
        setLocalError('');
    };

    const handleUpdateCartQuantity = (item, newQuantity) => {
        setLocalError('');
        const stock = products.find(p => p.id === item.id)?.stock || 0;

        if (newQuantity > stock) {
            setLocalError(`Bu ürünün stoğu ${stock} adettir. Daha fazla ekleyemezsiniz.`);
            return;
        }
        if (newQuantity <= 0) {
            handleRemoveFromCart(item.id);
            return;
        }

        setCart(cart.map(i =>
            i.id === item.id ? { ...i, quantity: newQuantity } : i
        ));
    };

    const handleCheckout = async () => {
        setLocalError('');
        if (cart.length === 0) {
            setLocalError('Sepetiniz boş. Lütfen önce ürün ekleyin.');
            return;
        }
        
        setIsLoading(true);
        try {
            await onMakeSale(cart); // Toast App.js'ten tetiklenir
            setCart([]);
        } catch (e) {
            // Hata Toast'ta gösterilir
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container sales-page-grid">

            {/* 1. Ürün Ekleme Paneli */}
            <div className="sale-form-column"> {/* lg:col-span-1 */}
                <h1 className="page-title-small">Ürün Ekle</h1>
                
                {/* ABONELİK BİTTİYSE UYARI */}
                {!isSubscriptionActive && (
                     <div className="alert-message alert-restricted mb-4">
                        Üyelik süreniz dolduğu için **satış yapamazsınız**. Yalnızca okuma modundasınız.
                    </div>
                )}
                
                <form onSubmit={handleAddToCart} className="form-card form-product-select">

                    {/* YEREL HATA UYARISI */}
                    {localError && <div className="alert-message alert-error">{localError}</div>}

                    {/* Ürün Arama */}
                    <div className="form-group search-wrapper">
                        <input
                            type="text"
                            placeholder="Ürün adı/kategorisi ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={!isSubscriptionActive} // Kısıtlama
                            className="form-input input-search"
                        />
                        <IconSearch className="icon-search" />
                    </div>

                    {/* Ürün Seçimi */}
                    <div className="form-group">
                        <label htmlFor="productSelect" className="form-label">Stoktan Seç</label>
                        <select
                            id="productSelect"
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setQuantity(1);
                            }}
                            disabled={!isSubscriptionActive} // Kısıtlama
                            className="form-select"
                        >
                            <option value="">{searchTerm ? `${searchableProducts.length} üründen seçin...` : 'Tüm ürünlerden seçin...'}</option>
                            {searchableProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatCurrency(p.price)} - Stok: {p.stock})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Adet */}
                    <div className="form-group">
                        <label htmlFor="quantity" className="form-label">Adet</label>
                        <input
                            id="quantity"
                            type="number"
                            min="1"
                            max={selectedProduct ? selectedProduct.stock : 1}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            disabled={!selectedProduct || !isSubscriptionActive} // Kısıtlama
                            className="form-input"
                        />
                    </div>

                    {/* Sepete Ekle Butonu */}
                    <div className="form-group">
                        <button
                            type="submit"
                            disabled={!selectedProduct || quantity <= 0 || !isSubscriptionActive} // Kısıtlama
                            className="btn btn-primary btn-full"
                        >
                            {isSubscriptionActive ? 'Sepete Ekle' : 'Üyelik Gerekiyor'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 2. Sepet Listesi ve Ödeme */}
            <div className="cart-summary-column"> {/* lg:col-span-2 */}
                <h1 className="page-title-small">Sepet ({cart.length} Ürün)</h1>

                <div className="form-card cart-checkout-card">

                    {cart.length === 0 ? (
                        <div className="cart-empty-message">
                            Sepetiniz boş. Soldan ürün ekleyin.
                        </div>
                    ) : (
                        <div className="cart-list-wrapper scroll-y-auto max-h-lg">
                            {cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="item-info">
                                        <p className="item-name">{item.name}</p>
                                        <p className="item-price-quantity">{formatCurrency(item.price)} x {item.quantity}</p>
                                    </div>
                                    <div className="item-actions">
                                        {/* Adet Kontrolü */}
                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateCartQuantity(item, item.quantity - 1)}
                                                disabled={!isSubscriptionActive} // Kısıtlama
                                                className="btn-icon btn-minus"
                                            >
                                                <IconMinus />
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateCartQuantity(item, Number(e.target.value))}
                                                min="1"
                                                max={products.find(p => p.id === item.id)?.stock || 1}
                                                disabled={!isSubscriptionActive} // Kısıtlama
                                                className="quantity-input"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateCartQuantity(item, item.quantity + 1)}
                                                disabled={!isSubscriptionActive} // Kısıtlama
                                                className="btn-icon btn-plus"
                                            >
                                                <IconPlus />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveFromCart(item.id)}
                                            disabled={!isSubscriptionActive} // Kısıtlama
                                            className="btn-icon btn-delete"
                                            title={isSubscriptionActive ? "Sepetten Çıkar" : "Üyelik Gerekli"}
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Toplam ve Ödeme Butonu */}
                    {cart.length > 0 && (
                        <div className="checkout-summary">
                            <div className="summary-total-row">
                                <span className="total-label">Toplam Tutar:</span>
                                <span className="total-value">{formatCurrency(cartTotal)}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isLoading || cart.length === 0 || !isSubscriptionActive} // Kısıtlama
                                className="btn btn-success btn-full btn-large"
                            >
                                {isLoading 
                                    ? <IconLoader width="32" height="32" className="icon-loader" /> 
                                    : (isSubscriptionActive ? 'Satışı Tamamla ve Sepeti Onayla' : 'Üyelik Gerekiyor')
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sales;