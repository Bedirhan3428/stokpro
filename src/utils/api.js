import { 
    db, 
    appId, // appId'nin bu dosyada tanımlı ve dolu olduğundan emin olmalısın.
    collection, 
    doc, 
    addDoc, 
    getDoc,
    updateDoc, 
    deleteDoc, 
    runTransaction,
    setDoc 
} from './firebase'; 


// KULLANILAN GÜVENLİ FİREBASE PATH'LERİ
// Örnek Yol: artifacts/uygulama-kimliği/users/kullanıcı-id/products
const getProductsPath = (userId) => `artifacts/${appId}/users/${userId}/products`;
const getCategoriesPath = (userId) => `artifacts/${appId}/users/${userId}/categories`;
const getSalesPath = (userId) => `artifacts/${appId}/users/${userId}/sales`;
const getExpensesPath = (userId) => `artifacts/${appId}/users/${userId}/expenses`;
const getIncomesPath = (userId) => `artifacts/${appId}/users/${userId}/incomes`;
const getUsersPath = (userId) => `artifacts/${appId}/users/${userId}/profile`;

// --- Gider İşlemleri ---
export const addExpense = async (userId, expenseData) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    const expensesRef = collection(db, getExpensesPath(userId));
    await addDoc(expensesRef, expenseData);
};

export const deleteExpense = async (userId, expenseId) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    const expenseRef = doc(db, getExpensesPath(userId), expenseId);
    await deleteDoc(expenseRef);
};

// --- Gelir İşlemleri (yeni) ---
export const addIncome = async (userId, incomeData) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    const incomesRef = collection(db, getIncomesPath(userId));
    await addDoc(incomesRef, incomeData);
};

export const deleteIncome = async (userId, incomeId) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    const incomeRef = doc(db, getIncomesPath(userId), incomeId);
    await deleteDoc(incomeRef);
};

// --- LİSANS AKTİVASYON İŞLEMİ ---
export const activateLicense = async (userId, licenseKey) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    if (!licenseKey) throw new Error("Lisans anahtarı boş olamaz."); 
    
    const licensesColRef = collection(db, 'licenses'); 
    const licenseRef = doc(licensesColRef, licenseKey); 
    const userProfileRef = doc(db, getUsersPath(userId), 'user_doc');
    
    let durationMonths = 0; 
    
    try {
        await runTransaction(db, async (transaction) => {
            
            // --- OKUMA İŞLEMLERİ ---
            const licenseDoc = await transaction.get(licenseRef);
            const userProfileDoc = await transaction.get(userProfileRef); 
            
            // LİSANS VARLIĞI KONTROLÜ
            if (!licenseDoc.exists()) {
                throw new Error("Geçersiz Ürün Anahtarı.");
            }
            
            // PROFİL VARLIĞI KONTROLÜ
            if (!userProfileDoc.exists()) {
                   throw new Error("Kullanıcı profil verisi okunamadı. Lütfen tekrar deneyin.");
            }

            const licenseData = licenseDoc.data();
            const profileData = userProfileDoc.data();
            
            // 1. Kural: Anahtar kullanılmamış olmalı
            if (licenseData.status && licenseData.status !== 'unused') {
                throw new Error("Bu anahtar zaten kullanılmış.");
            }
            
            // 2. Kural: Abonelik Süresini Hesapla
            durationMonths = licenseData.durationMonths || 1; 
            let newEndDate = new Date();
            
            // Eğer kullanıcının aktif aboneliği varsa, yeni süreyi eskisinin üzerine ekle
            if (profileData.subscriptionEndDate) {
                const currentEndDate = profileData.subscriptionEndDate.toDate();
                if (currentEndDate > newEndDate) {
                   newEndDate = currentEndDate;
                }
            }

            newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

            // 3. Yazma İşlemleri (Transaction)
            
            // a) Lisansı Güncelle
            transaction.update(licenseRef, {
                status: 'activated',
                activatedBy: userId,
                activationDate: new Date()
            });
            
            // b) Kullanıcı Profilini Güncelle
            transaction.update(userProfileRef, {
                subscriptionStatus: 'premium',
                subscriptionEndDate: newEndDate
            });
        });
        
        // Transaction başarılı olduysa, süre bilgisini Toast için döndür
        return { success: true, duration: durationMonths }; 
        
    } catch (e) {
        const errorMessage = e.message.includes("Abonelik sona erdi") ? e.message : `Aktivasyon başarısız: ${e.message}`;
        throw new Error(errorMessage);
    }
};


// --- Kullanıcı İşlemleri (createOrUpdateUserProfile) ---
export const createOrUpdateUserProfile = async (userId, email, displayName) => {
    if (!userId) throw new Error("Kullanıcı UID'si eksik.");

    const profileRef = doc(db, getUsersPath(userId), 'user_doc');

    const profileData = {
        email: email || 'bilinmiyor',
        displayName: displayName || 'Yeni Kullanıcı',
        lastLogin: new Date(),
    };
    
    await setDoc(profileRef, profileData, { merge: true });
};

// --- Kategori İşlemleri ---
export const addCategory = async (userId, categories, categoryName) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    const existing = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (existing) { console.log("Kategori zaten mevcut:", categoryName); return; }
    const categoriesRef = collection(db, getCategoriesPath(userId));
    await addDoc(categoriesRef, { name: categoryName });
};

// --- Ürün İşlemleri ---
export const addProduct = async (userId, productData) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    const productsRef = collection(db, getProductsPath(userId));
    await addDoc(productsRef, { ...productData, createdAt: new Date() });
};

export const updateStock = async (userId, product, amountToAdd) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    if (amountToAdd <= 0) throw new Error("Eklenecek adet 0'dan büyük olmalı.");

    const productRef = doc(db, getProductsPath(userId), product.id);
    try {
        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) { throw new Error("Stok eklenmek istenen ürün bulunamadı."); }
            const currentStock = productDoc.data().stock || 0;
            const newStock = currentStock + amountToAdd;
            transaction.update(productRef, { stock: newStock });
        });
    } catch (e) {
        throw e;
    }
};

export const deleteProduct = async (userId, productId) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");

    const collectionPath = getProductsPath(userId);
    const fullDocPath = `${collectionPath}/${productId}`;
    
    console.log("-----------------------------------------");
    console.log("Silme İşlemi Başlatıldı.");
    console.log(`userId: ${userId}`);
    console.log(`productId: ${productId}`);
    console.log(`Koleksiyon Yolu (getProductsPath): ${collectionPath}`);
    console.log(`TAM DOKÜMAN YOLU: ${fullDocPath}`);
    console.log("-----------------------------------------");

    const productRef = doc(db, collectionPath, productId);
    await deleteDoc(productRef);
};


export const updateProductDetails = async (userId, productId, newData) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    
    const productRef = doc(db, getProductsPath(userId), productId);
    
    await updateDoc(productRef, newData);
};

// Kullanıcının profil bilgilerini okur
export const getUserProfile = async (userId) => {
    if (!userId) return null;
    
    const profileRef = doc(db, getUsersPath(userId), 'user_doc');
    
    try {
        const docSnap = await getDoc(profileRef); 
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        return null;
    } catch (error) {
        return null;
    }
};

// --- Satış İşlemi ---
export const makeSale = async (userId, cart) => {
    if (!userId) throw new Error("Kullanıcı girişi yapılmamış.");
    if (cart.length === 0) throw new Error("Sepet boş.");

    const salesColRef = collection(db, getSalesPath(userId));
    const totalSalePrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
        await runTransaction(db, async (transaction) => {
            const stockChecks = [];
            for (const item of cart) {
                const productRef = doc(db, getProductsPath(userId), item.id);
                const productDoc = await transaction.get(productRef); 
                
                if (!productDoc.exists()) {
                    throw new Error(`Ürün bulunamadı: ${item.name}`);
                }
                
                const currentStock = productDoc.data().stock;
                
                if (currentStock < item.quantity) {
                    throw new Error(`Yetersiz stok! "${item.name}" için mevcut stok: ${currentStock}`);
                }

                stockChecks.push({
                    ref: productRef,
                    newStock: currentStock - item.quantity
                });
            }
            
            for (const check of stockChecks) {
                transaction.update(check.ref, { stock: check.newStock });
            }
            
            const saleData = {
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    category: item.category,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    totalPrice: item.price * item.quantity,
                })),
                totalPrice: totalSalePrice,
                date: new Date()
            };
            const newSaleRef = doc(salesColRef);
            transaction.set(newSaleRef, saleData);
            
        });

        console.log("Çoklu satış işlemi başarılı!");
    } catch (e) {
        throw e;
    }
};