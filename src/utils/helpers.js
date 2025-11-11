// --- Global Yardımcı Fonksiyonlar ---
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value || 0);
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '...';
  const dateObj = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(0));
  return dateObj.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ISO Week Number Hesaplama Fonksiyonu
export const getYearWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
};

export const normalizeSalesData = (sales) => {
    let normalized = [];
    sales.forEach(sale => {
        // Yeni çoklu-ürün satış yapısı
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                normalized.push({
                    id: sale.id + '-' + item.productId,
                    productName: item.productName,
                    category: item.category,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    date: sale.date
                });
            });
        } else if (sale.productName && sale.totalPrice) {
            // Eski tekli-ürün satış yapısı (Geriye dönük uyumluluk)
            normalized.push({
                id: sale.id,
                productName: sale.productName,
                category: sale.category,
                quantity: sale.quantity,
                totalPrice: sale.totalPrice,
                date: sale.date
            });
        }
    });
    return normalized.sort((a, b) => (b.date?.toDate() || 0) - (a.date?.toDate() || 0));
};

export const formatMonth = (period) => {
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('tr-TR', { year: 'numeric', month: 'long' });
}

export const EXPENSE_CATEGORIES = ['Maaş', 'Kira', 'Fatura/Vergi', 'Pazarlama', 'Tedarik', 'Diğer'];