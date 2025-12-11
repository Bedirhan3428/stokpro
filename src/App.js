import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "./App.css";
 // THEME CSS IMPORT
import { AuthProvider } from "./contexts/AuthContext";

import RequireAuth from "./components/RequireAuth";

const Home = React.lazy(() => import("./components/Home"));
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
const Info = React.lazy(() => import("./components/info"));
const ForgotPassword = React.lazy(() => import("./components/ForgotPassword"));
const VerifyEmail = React.lazy(() => import("./components/VerifyEmail"));

function App() {
  return (
    <BrowserRouter>
      
        <AuthProvider>
          <Suspense fallback={<div className="app-loading"><div className="spinner" /><p>Yükleniyor...</p></div>}>
            <Navbar />
            <main className="app-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<RequireAuth><VerifyEmail /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
                <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                <Route path="/accounting" element={<RequireAuth><Accounting /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </Suspense>
        </AuthProvider>
      
    </BrowserRouter>
  );
}

export default App;