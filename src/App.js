import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./index.css";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";

import RequireAuth from "./components/RequireAuth";

// Mevcut Bileşenler
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
const Info = React.lazy(() => import("./components/info")); // Dosya adı küçük harfle ise aynen kalsın
const ForgotPassword = React.lazy(() => import("./components/ForgotPassword"));
const VerifyEmail = React.lazy(() => import("./components/VerifyEmail"));
const ResetPassword = React.lazy(() => import("./components/ResetPassword"));
const Contact = React.lazy(() => import("./components/Contact"));

// --- YENİ EKLENEN BİYOLOJİ BİLEŞENİ ---
const Biyoloji = React.lazy(() => import("./components/Biyoloji"));

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
              <Route path="/contact" element={<Contact />} />

              {/* Yasal Sayfalar */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* --- YENİ ROTA: BİYOLOJİ --- */}
              {/* Eğer giriş zorunlu olsun istersen RequireAuth içine al */}
              <Route path="/biyoloji" element={<Biyoloji />} />

              {/* Korumalı Sayfalar (Giriş Gerekli) */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
              <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
              <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
              <Route path="/accounting" element={<RequireAuth><Accounting /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

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


