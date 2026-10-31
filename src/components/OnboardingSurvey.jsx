"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { saveSurveyResponse } from "../utils/firebaseHelpers";
import {
  updateLocalStorageDirectly,
  invalidateAndRefreshMasterCache,
} from "../utils/masterDataCache";
import { logUserActivity } from "../utils/telemetryLogger";
import {
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiBox,
  FiShoppingBag,
  FiTruck,
  FiTool,
  FiTag,
  FiFileText,
  FiCpu,
  FiLayers,
  FiSkipForward,
} from "react-icons/fi";

const SECTORS = [
  {
    key: "tekstil",
    title: "Tekstil / İmalat",
    desc: "Atölye, konfeksiyon, dikimhane ve fason üretim",
    icon: FiLayers,
    badge: "Popüler",
  },
  {
    key: "perakende",
    title: "Perakende / Mağaza",
    desc: "Butik, market, hırdavat, kırtasiye ve perakende satış",
    icon: FiShoppingBag,
    badge: "Hızlı Satış",
  },
  {
    key: "toptan",
    title: "Toptan / Dağıtım",
    desc: "Tedarikçi, depo, toptancı ve dağıtım ağı yönetimi",
    icon: FiTruck,
  },
  {
    key: "diger",
    title: "Diğer",
    desc: "Hizmet, serbest meslek veya farklı bir sektör",
    icon: FiTool,
  },
];

const PRIMARY_NEEDS = [
  {
    key: "barkod_stok",
    title: "Barkodlu hızlı stok ve varyant takibi",
    desc: "Barkod okutma, beden/renk varyantları ve kritik stok alarmları",
    icon: FiTag,
  },
  {
    key: "cari_kasa",
    title: "Cari, fatura ve kasa takibi",
    desc: "Müşteri veresiye borçları, PDF fatura ve anlık gelir/gider",
    icon: FiFileText,
  },
  {
    key: "uretim_izleme",
    title: "Üretim / imalat süreçlerini izleme",
    desc: "Hammadde girişi, ürün maliyeti ve iş/reçete süreçleri",
    icon: FiCpu,
  },
  {
    key: "depo_sube",
    title: "Çoklu şube / depo yönetimi",
    desc: "Depolar arası transfer, raf düzeni ve toplu envanter dökümü",
    icon: FiBox,
  },
];

export default function OnboardingSurvey({ onCompleted = null }) {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSector, setSelectedSector] = useState("perakende");
  const [customSector, setCustomSector] = useState("");
  const [selectedNeed, setSelectedNeed] = useState("barkod_stok");
  const [saving, setSaving] = useState(false);

  const handleFinish = async (isSkipped = false) => {
    if (saving) return;
    setSaving(true);

    try {
      const sectorObj = SECTORS.find((s) => s.key === selectedSector);
      const needObj = PRIMARY_NEEDS.find((n) => n.key === selectedNeed);

      const sectorTitle = isSkipped
        ? "Genel"
        : selectedSector === "diger" && customSector.trim()
        ? customSector.trim()
        : sectorObj?.title || "Genel";
      const needTitle = isSkipped
        ? "Genel Stok & Satış"
        : needObj?.title || "Genel Stok & Satış";

      const payload = {
        sector: sectorTitle,
        sectorKey: isSkipped ? "genel" : selectedSector,
        customSector: customSector.trim(),
        primaryNeed: needTitle,
        needKey: isSkipped ? "genel" : selectedNeed,
        onboardingCompleted: true,
        onboardingSkipped: Boolean(isSkipped),
        onboardingCompletedAt: new Date().toISOString(),
      };

      if (user?.uid) {
        try {
          await saveSurveyResponse(payload, user.uid);
        } catch (saveErr) {
          console.warn("Anket kaydı hatası:", saveErr);
        }
      }

      updateLocalStorageDirectly((store) => ({
        ...store,
        profile: {
          ...(store.profile || {}),
          ...payload,
        },
      }));

      invalidateAndRefreshMasterCache().catch(() => {});

      logUserActivity(
        isSkipped ? "SURVEY_SKIP" : "SURVEY_COMPLETE",
        isSkipped ? "Onboarding Anketi Atlandı" : `Onboarding Anketi Tamamlandı: ${sectorTitle}`,
        payload,
        { uid: user?.uid, email: user?.email }
      ).catch(() => {});

      if (onCompleted) {
        onCompleted(payload);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.warn("Onboarding kaydı hatası:", err);
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-[#F7F7F5] dark:bg-[#0D0D11] flex items-center justify-center px-4 py-10 font-sans"
      role="main"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#16161B] border border-[#E8E8E4] dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(24,24,27,0.05)] dark:shadow-2xl">
        {/* İlerleme Çubuğu */}
        <div className="w-full h-1.5 bg-[#F0F0EC] dark:bg-white/10">
          <div
            className="h-full bg-[#A66B49] transition-all duration-300"
            style={{ width: currentStep === 1 ? "50%" : "100%" }}
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Üst Başlık */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#A66B49] block">
                ADIM {currentStep} / 2 &bull;{" "}
                {currentStep === 1 ? "SEKTÖR SEÇİMİ" : "ÖNCELİKLİ İHTİYAÇ"}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#18181B] dark:text-[#F7F7F5] tracking-tight">
                {currentStep === 1
                  ? "İşletmenizin ana faaliyet alanı nedir?"
                  : "Öncelikli operasyon hedefiniz nedir?"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => handleFinish(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F7F5] hover:bg-[#ECECE8] dark:bg-white/5 dark:hover:bg-white/10 border border-[#E8E8E4] dark:border-white/10 text-xs font-semibold text-[#71717A] dark:text-zinc-400 transition cursor-pointer shrink-0"
            >
              <span>Geç</span>
              <FiSkipForward size={13} />
            </button>
          </div>

          {/* Seçenek Kartları */}
          {currentStep === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SECTORS.map((s) => {
                  const Icon = s.icon;
                  const isSelected = selectedSector === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSelectedSector(s.key)}
                      className={`text-left p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-3 ${
                        isSelected
                          ? "bg-[#F7F7F5] dark:bg-white/[0.06] border-[#A66B49] ring-1 ring-[#A66B49]"
                          : "bg-white dark:bg-[#0D0D11]/60 border-[#E8E8E4] dark:border-white/10 hover:border-[#A66B49]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            isSelected
                              ? "bg-[#18181B] dark:bg-[#A66B49] border-[#18181B] dark:border-[#A66B49] text-white"
                              : "bg-[#F7F7F5] dark:bg-white/5 border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5]"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? "bg-[#A66B49] border-[#A66B49] text-white"
                              : "border-[#E8E8E4] dark:border-white/20"
                          }`}
                        >
                          {isSelected && <FiCheck size={12} />}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-extrabold text-[#18181B] dark:text-[#F7F7F5]">
                            {s.title}
                          </strong>
                          {s.badge && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#A66B49]/15 text-[#A66B49]">
                              {s.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#71717A] dark:text-zinc-400 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedSector === "diger" && (
                <div>
                  <label className="block text-xs font-bold text-[#18181B] dark:text-zinc-300 mb-1.5">
                    Faaliyet Alanınız (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                    placeholder="Örn: Oto Yedek Parça, Mobilya, E-ticaret..."
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] dark:bg-[#0D0D11] border border-[#E8E8E4] dark:border-white/10 focus:border-[#A66B49] text-[#18181B] dark:text-white text-sm outline-none transition"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PRIMARY_NEEDS.map((n) => {
                const Icon = n.icon;
                const isSelected = selectedNeed === n.key;
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => setSelectedNeed(n.key)}
                    className={`text-left p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-3 ${
                      isSelected
                        ? "bg-[#F7F7F5] dark:bg-white/[0.06] border-[#A66B49] ring-1 ring-[#A66B49]"
                        : "bg-white dark:bg-[#0D0D11]/60 border-[#E8E8E4] dark:border-white/10 hover:border-[#A66B49]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isSelected
                            ? "bg-[#18181B] dark:bg-[#A66B49] border-[#18181B] dark:border-[#A66B49] text-white"
                            : "bg-[#F7F7F5] dark:bg-white/5 border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-[#F7F7F5]"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? "bg-[#A66B49] border-[#A66B49] text-white"
                            : "border-[#E8E8E4] dark:border-white/20"
                        }`}
                      >
                        {isSelected && <FiCheck size={12} />}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-sm font-extrabold text-[#18181B] dark:text-[#F7F7F5] block">
                        {n.title}
                      </strong>
                      <p className="text-xs text-[#71717A] dark:text-zinc-400 leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Alt Butonlar */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E8E8E4] dark:border-white/10">
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F7F7F5] hover:bg-[#ECECE8] dark:bg-white/5 dark:hover:bg-white/10 border border-[#E8E8E4] dark:border-white/10 text-[#18181B] dark:text-zinc-300 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <FiArrowLeft size={15} />
                <span>Geri</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(true)}
                disabled={saving}
                className="text-xs font-semibold text-[#71717A] hover:text-[#18181B] dark:text-zinc-400 dark:hover:text-white bg-transparent border-0 cursor-pointer"
              >
                Varsayılan kurulumla geç
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <span>Devam Et</span>
                <FiArrowRight size={15} className="text-[#A66B49] dark:text-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] dark:bg-[#A66B49] dark:hover:bg-[#8D583A] text-white text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? "Hazırlanıyor..." : "Paneli Başlat"}</span>
                <FiArrowRight size={15} className="text-[#A66B49] dark:text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
