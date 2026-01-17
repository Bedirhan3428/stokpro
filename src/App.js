import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./index.css";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";

import RequireAuth from "./components/RequireAuth";
import TermsModal from "./components/TermsModal"; // <-- YENİ: Modal import edildi

// Mevcut Bileşenler (Lazy Load)
const Home = React.lazy(() => import("./components/Home"));
const ProductKey = React.lazy(() => import("./components/ProductKey"));
const Dashboard = React.lazy(() => import("./components/Dashboard"));
const Products = React.lazy(() => import("./components/Products"));
const Sales = React.lazy(() => import("./components/Sales"));
const Customers = React.lazy(() => import("./components/Customers"));
const Accounting = React.lazy(() => import("./components/Accounting"));
const NotFound = React.lazy(() => import("./components/NotFound"));
const Navbar = React.lazy(() => import("./components/Navbar"));
const Login = React.lazy(() => import("./components/Login"));
const Register = React.lazy(() => import("./components/Register"));
const Settings = React.lazy(() => import("./components/Settings"));
const ForgotPassword = React.lazy(() => import("./components/ForgotPassword"));
const VerifyEmail = React.lazy(() => import("./components/VerifyEmail"));
const ResetPassword = React.lazy(() => import("./components/ResetPassword"));

// --- YENİ EKLENEN BİLEŞENLER ---
// Hacker Temalı Admin Paneli
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));

// Yasal Sayfalar
const PrivacyPolicy = React.lazy(() => import("./PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./TermsOfService"));

function ActionRedirector() {
  const location = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");
    if (oobCode && (mode === "verifyEmail" || mode === "resetPassword")) {
      const target = mode === "verifyEmail" ? "/verify-email" : "/reset-password";
      nav(`${target}?${params.toString()}`, { replace: true });
    }
  }, [location.search, nav]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Modal'ı buraya ekledik. AuthContext içinde olduğu için kullanıcıyı tanır */}
        <TermsModal />
        
        <Suspense fallback={<div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div>}>
          <ActionRedirector />
          <Navbar />
          <main className="app-container">
            <Routes>
              {/* Genel Sayfalar */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/product-key" element={<ProductKey />} />

              {/* Yasal Sayfalar */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* --- Korumalı Sayfalar (Giriş Gerekli) --- */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

              {/* Güvenli Ürünler Sayfası (Kendi iç güvenlik kontrolü de var) */}
              <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />

              <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
              <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
              <Route path="/accounting" element={<RequireAuth><Accounting /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

              {/* --- YENİ ADMİN PANELİ ROTASI --- */}
              {/* RequireAuth ile sarmaladık ki sadece giriş yapmış kullanıcılar hacker ekranını görebilsin */}
              <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
