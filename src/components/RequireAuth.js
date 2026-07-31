"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    // SADECE E-posta henüz doğrulanmamışsa sunucuya sor (Doğrulanmış oturumda 0ms Hızlı Açılış)
    if (!user || user.emailVerified) {
      setCheckingEmail(false);
      return;
    }

    let mounted = true;
    async function refreshEmailStatus() {
      setCheckingEmail(true);
      try {
        await user.reload();
      } catch (e) {
        // quiet
      } finally {
        if (mounted) setCheckingEmail(false);
      }
    }

    refreshEmailStatus();
    return () => {
      mounted = false;
    };
  }, [user?.emailVerified]);

  useEffect(() => {
    if (!loading && !checkingEmail) {
      if (!user) {
        router.replace("/login");
      } else if (!user.emailVerified) {
        router.replace("/verify-email");
      }
    }
  }, [user, loading, checkingEmail, router]);

  if (loading || checkingEmail) {
    return (
      <div className="ra-yukleme" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Oturum doğrulanıyor...</p>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return null;
  }

  return children;
}