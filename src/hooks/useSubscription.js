"use client";

import { useEffect, useState } from "react";
import { getMasterStoreSnapshot, subscribeToMasterStore } from "../utils/masterDataCache";
import { getUserProfile } from "../utils/firebaseHelpers";

function checkActiveStatus(p) {
  if (!p) return false;
  const status = (p.subscriptionStatus ?? p.subscription_status ?? "").toString().toLowerCase();
  if (status === "premium" || status === "active") return true;

  const end = p.subscriptionEndDate ?? p.subscription_end_date ?? null;
  if (end) {
    try {
      let d = end;
      if (typeof d === "object" && typeof d.toDate === "function") d = d.toDate();
      else if (typeof d === "object" && d.seconds) d = new Date(d.seconds * 1000);
      else d = new Date(d);
      if (!isNaN(d.getTime()) && d.getTime() > Date.now()) return true;
    } catch {}
  }
  return false;
}

export default function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Önce Master Cache Anlık Görüntüsünden Oku (0ms Hızlı Açılış)
    const snap = getMasterStoreSnapshot();
    if (snap?.profile) {
      setProfile(snap.profile);
      setActive(checkActiveStatus(snap.profile));
      setLoading(false);
    }

    // 2. Master Store Abonesi Ol
    const unsub = subscribeToMasterStore((store) => {
      if (!mounted) return;
      if (store?.profile) {
        setProfile(store.profile);
        setActive(checkActiveStatus(store.profile));
        setLoading(false);
      }
    });

    // 3. Hafızada profil yoksa Firebase'den çek
    if (!snap?.profile) {
      getUserProfile().then((p) => {
        if (!mounted) return;
        setProfile(p || null);
        setActive(checkActiveStatus(p));
        setLoading(false);
      }).catch(() => {
        if (mounted) setLoading(false);
      });
    }

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return { loading, active, profile };
}