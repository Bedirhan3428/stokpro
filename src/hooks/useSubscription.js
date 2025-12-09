
import { useEffect, useState } from "react";
import { getUserProfile } from "../utils/firebaseHelpers";

/**
 * useSubscription
 * - loading: profil okunuyor mu
 * - active: abonelik aktifse true
 * - profile: ham profil objesi
 *
 * Aktif kabul şartları:
 *  - subscriptionStatus === 'premium' || 'active'
 *  - veya subscriptionEndDate > now
 */
export default function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        setProfile(p || null);

        let isActive = false;
        if (p) {
          const status = (p.subscriptionStatus ?? p.subscription_status ?? "").toString().toLowerCase();
          if (status === "premium" || status === "active") isActive = true;
          else {
            const end = p.subscriptionEndDate ?? p.subscription_end_date ?? null;
            if (end) {
              try {
                let d = end;
                if (typeof d === "object" && typeof d.toDate === "function") d = d.toDate();
                else if (typeof d === "object" && d.seconds) d = new Date(d.seconds * 1000);
                else d = new Date(d);
                if (!isNaN(d.getTime()) && d.getTime() > Date.now()) isActive = true;
              } catch {}
            }
          }
        }

        setActive(isActive);
      } catch (err) {
        console.error("useSubscription error", err);
        setProfile(null);
        setActive(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return { loading, active, profile };
}