"use client";

import React from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import SurveyAnalytics from "../../src/components/SurveyAnalytics";
import NotFound from "../../src/components/NotFound";

const AUTHORIZED_EMAIL = "abimer2350@gmail.com";

export default function AnketPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "1rem" }}>
        <div className="spinner" />
        <p style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.9rem" }}>Yetki doğrulanıyor...</p>
      </div>
    );
  }

  // GÜVENLİK PROTOKOLÜ: SADECE abimer2350@gmail.com ERİŞEBİLİR. DİĞER TÜM OTURUMLAR 404 ALIR.
  if (!user || user.email?.trim().toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
    return <NotFound />;
  }

  return <SurveyAnalytics />;
}
