import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Eğer kullanıcı var ama emailVerified false ise, fresh durum için reload et
  useEffect(() => {
    let mounted = true;
    async function refreshEmailStatus() {
      if (!user || user.emailVerified) return;
      setCheckingEmail(true);
      try {
        await user.reload();
      } catch (e) {
        // sessiz yut
      } finally {
        if (mounted) setCheckingEmail(false);
      }
    }
    refreshEmailStatus();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading || checkingEmail) {
    return (
      <div className="ra-yukleme">
        <div className="ra-spinner" />
        <p>Oturum doğrulanıyor...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Reload sonrası da doğrulanmadıysa, verify-email’e yönlendir
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  return children;
}