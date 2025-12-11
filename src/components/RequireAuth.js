
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="ra-yukleme">
        <div className="ra-spinner" />
        <p>Oturum doğrulanıyor...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Redirect to verify-email if user hasn't verified their email and isn't already on that page
  if (user && !user.emailVerified && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }
  
  return children;
}