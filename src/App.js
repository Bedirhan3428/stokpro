import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    auth,
    db,
    appId,
    onAuthStateChanged,
    signOut,
    collection,
    query,
    onSnapshot
} from './utils/firebase';
import { formatCurrency, normalizeSalesData } from './utils/helpers';
import AuthScreen from './components/AuthScreen';
import {
    addProduct,
    updateStock,
    deleteProduct,
    addCategory,
    makeSale,
    addExpense,
    deleteExpense,
    updateProductDetails,
    getUserProfile,
    activateLicense,
    addIncome,
    deleteIncome
} from './utils/api';

import { ToastContainer, toast } from 'react-toastify';

import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import AddProduct from './pages/AddProduct';
import Sales from './pages/Sales';
import ExpenseManager from './pages/ExpenseManager';
import CategoryManager from './pages/CategoryManager';
import AccountingPage from './pages/AccountingPage';
import SubscriptionPage from './pages/SubscriptionPage';
import EmailVerificationScreen from './components/EmailVerificationScreen';

function App() {
    const [page, setPage] = useState('dashboard');
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const [userProfile, setUserProfile] = useState(null);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sales, setSales] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);

    const normalizedSales = useMemo(() => normalizeSalesData(sales), [sales]);

    const isSubscriptionActive = useMemo(() => {
        if (!userProfile) return false;
        const status = userProfile.subscriptionStatus;
        const endDate = userProfile.subscriptionEndDate?.toDate ? userProfile.subscriptionEndDate.toDate() : null;
        if (status !== 'premium') return false;
        if (endDate && endDate < new Date()) return false;
        return true;
    }, [userProfile]);

    const checkActive = useCallback(() => {
        if (!isSubscriptionActive) {
            throw new Error("Aboneliğiniz sona ermiştir. Yalnızca okuma modundasınız.");
        }
    }, [isSubscriptionActive]);

    const loadUserProfile = useCallback(async (uid) => {
        const profile = await getUserProfile(uid);
        setUserProfile(profile);
    }, []);

    const handleAddProduct = useCallback(async (productData) => {
        try {
            checkActive();
            await addProduct(userId, productData);
            toast.success(`Ürün "${productData.name}" başarıyla eklendi!`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleUpdateStock = useCallback(async (product, amountToAdd) => {
        try {
            checkActive();
            await updateStock(userId, product, amountToAdd);
            toast.success(`Stok güncellendi: ${product.name} +${amountToAdd} adet`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleDeleteProduct = useCallback(async (productId) => {
        const productName = products.find(p => p.id === productId)?.name || 'Ürün';
        try {
            checkActive();
            await deleteProduct(userId, productId);
            toast.success(`Ürün "${productName}" başarıyla silindi.`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, products, checkActive]);

    const handleAddCategory = useCallback(async (categoryName) => {
        try {
            checkActive();
            await addCategory(userId, categories, categoryName);
            toast.success(`Kategori "${categoryName}" başarıyla eklendi!`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, categories, checkActive]);

    const handleMakeSale = useCallback(async (cart) => {
        try {
            checkActive();
            await makeSale(userId, cart);
            toast.success(`Satış başarıyla tamamlandı!`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleAddExpense = useCallback(async (expenseData) => {
        try {
            checkActive();
            await addExpense(userId, expenseData);
            toast.success(`Gider başarıyla kaydedildi.`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleDeleteExpense = useCallback(async (expenseId) => {
        try {
            checkActive();
            await deleteExpense(userId, expenseId);
            toast.success(`Gider başarıyla silindi.`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleUpdateProduct = useCallback(async (productId, newData) => {
        try {
            checkActive();
            await updateProductDetails(userId, productId, newData);
            toast.success(`Ürün "${newData.name}" detayları güncellendi.`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleActivateLicense = useCallback(async (licenseKey) => {
        try {
            const result = await activateLicense(userId, licenseKey);
            if (result.success) {
                toast.success(`Aboneliğiniz başarıyla aktive edildi! ${result.duration} ay Premium üyeliğiniz başladı.`);
            }
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId]);

    // formatCurrency import is a module-level helper (immutable). Exclude it from deps to avoid unnecessary ESLint warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleAddIncome = useCallback(async (incomeData) => {
        try {
            checkActive();
            await addIncome(userId, incomeData);
            toast.success(`Gelir (${formatCurrency(incomeData.amount)}) başarıyla kaydedildi.`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    const handleDeleteIncome = useCallback(async (incomeId) => {
        try {
            checkActive();
            await deleteIncome(userId, incomeId);
            toast.success(`Gelir kaydı başarıyla silindi.`);
        } catch (e) {
            toast.error(`${e.message}`);
        }
    }, [userId, checkActive]);

    useEffect(() => {
        if (!auth) {
            setError("Firebase düzgün başlatılamadı.");
            setIsLoading(false);
            return;
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setUserId(user.uid);
                if (user.emailVerified) {
                    loadUserProfile(user.uid);
                } else {
                    setUserProfile(null);
                }
            } else {
                setCurrentUser(null);
                setUserId(null);
                setUserProfile(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribeAuth();
    }, [loadUserProfile]);

    // appId is a module-level constant (imported); exclude it from deps to avoid the "outer scope" eslint warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!userId || (currentUser && !currentUser.emailVerified)) return;

        setIsLoading(true);

        const productsPath = `artifacts/${appId}/users/${userId}/products`;
        const categoriesPath = `artifacts/${appId}/users/${userId}/categories`;
        const salesPath = `artifacts/${appId}/users/${userId}/sales`;
        const expensesPath = `artifacts/${appId}/users/${userId}/expenses`;
        const incomesPath = `artifacts/${appId}/users/${userId}/incomes`;

        const qProducts = query(collection(db, productsPath));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
            setIsLoading(false);
        }, (err) => {
            console.error("Ürünler çekilirken hata:", err);
            setError("Ürün verisi alınamadı.");
            setIsLoading(false);
        });

        const qCategories = query(collection(db, categoriesPath));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesData);
        }, (err) => {
            console.error("Kategoriler çekilirken hata:", err);
            setError("Kategori verisi alınamadı.");
        });

        const qSales = query(collection(db, salesPath));
        const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
            const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesData);
        }, (err) => {
            console.log("Satışlar çekilirken hata:", err);
            setError("Satış verisi alınamadı.");
        });

        const qExpenses = query(collection(db, expensesPath));
        const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id, ...doc.data(), date: doc.data().date?.toDate() || new Date()
            }));
            setExpenses(expensesData);
        }, (err) => {
            console.error("Giderler çekilirken hata:", err);
            setError("Gider verisi alınamadı.");
        });

        const qIncomes = query(collection(db, incomesPath));
        const unsubscribeIncomes = onSnapshot(qIncomes, (snapshot) => {
            const incomesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date()
            }));
            setIncomes(incomesData);
        }, (err) => {
            console.error("Gelirler çekilirken hata:", err);
            setError("Gelir verisi alınamadı.");
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
            unsubscribeSales();
            unsubscribeExpenses();
            unsubscribeIncomes();
        };
    }, [userId, currentUser]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setPage('dashboard');
            toast.info("Oturum başarıyla kapatıldı.");
        } catch (e) {
            toast.error(`Çıkış yapılırken hata: ${e.message}`);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-red-100 dark:bg-red-900 text-gray-900 dark:text-white flex items-center justify-center p-4">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-200 mb-4">Bir Hata Oluştu</h2>
                    <p className="text-red-600 dark:text-red-300">{error}</p>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return <LoadingScreen message="Veritabanına bağlanılıyor ve veriler yükleniyor..." />;
    }

    if (!userId) {
        return <AuthScreen />;
    }

    if (userId && currentUser && !currentUser.emailVerified) {
        return <EmailVerificationScreen userEmail={currentUser.email} />;
    }

    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <Dashboard
                    products={products}
                    normalizedSales={normalizedSales}
                    expenses={expenses}
                    incomes={incomes}
                    userProfile={userProfile}
                    isSubscriptionActive={isSubscriptionActive}
                />;
            case 'products':
                return <ProductList products={products} categories={categories} onUpdateStock={handleUpdateStock} onDeleteProduct={handleDeleteProduct} onUpdateProduct={handleUpdateProduct} isSubscriptionActive={isSubscriptionActive} />;
            case 'add_product':
                return <AddProduct categories={categories} onAddProduct={handleAddProduct} onAddCategory={handleAddCategory} isSubscriptionActive={isSubscriptionActive} />;
            case 'sales':
                return <Sales products={products} onMakeSale={handleMakeSale} isSubscriptionActive={isSubscriptionActive} />;
            case 'expenses':
                return <ExpenseManager
                    expenses={expenses}
                    incomes={incomes}
                    onAddExpense={handleAddExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onAddIncome={handleAddIncome}
                    onDeleteIncome={handleDeleteIncome}
                    isSubscriptionActive={isSubscriptionActive}
                />;
            case 'categories':
                return <CategoryManager categories={categories} onAddCategory={handleAddCategory} isSubscriptionActive={isSubscriptionActive} />;
            case 'accounting':
                return <AccountingPage normalizedSales={normalizedSales} expenses={expenses} incomes={incomes} />;
            case 'subscription':
                return <SubscriptionPage userProfile={userProfile} userId={userId} isSubscriptionActive={isSubscriptionActive} onActivateLicense={handleActivateLicense} />;
            default:
                return <Dashboard products={products} normalizedSales={normalizedSales} expenses={expenses} incomes={incomes} userProfile={userProfile} isSubscriptionActive={isSubscriptionActive} />;
        }
    };

    return (
        <div className="app-wrapper">
            <Navbar currentPage={page} setPage={setPage} onSignOut={handleSignOut} />

            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                theme="colored"
            />

            <main className="main-content-container">
                {renderPage()}
            </main>
        </div>
    );
}

export default App;