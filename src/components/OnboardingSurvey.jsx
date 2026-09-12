"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { saveSurveyResponse } from "../utils/firebaseHelpers";
import { updateLocalStorageDirectly, invalidateAndRefreshMasterCache } from "../utils/masterDataCache";
import { logUserActivity } from "../utils/telemetryLogger";
import { 
  FiCheck, FiArrowRight, FiArrowLeft, FiZap, FiBox, FiShoppingBag, 
  FiTruck, FiTool, FiTag, FiFileText, FiCpu, FiLayers, FiSkipForward
} from "react-icons/fi";

const SECTORS = [
  {
    key: "tekstil",
    title: "Tekstil / İmalat",
    desc: "Atölye, konfeksiyon, dikimhane ve fason üretim",
    icon: FiLayers,
    badge: "Popüler",
    color: "#3b82f6"
  },
  {
    key: "perakende",
    title: "Perakende / Mağaza",
    desc: "Butik, market, hırdavat, kırtasiye ve perakende satış",
    icon: FiShoppingBag,
    badge: "Hızlı Satış",
    color: "#10b981"
  },
  {
    key: "toptan",
    title: "Toptan / Dağıtım",
    desc: "Tedarikçi, depo, toptancı ve dağıtım ağı yönetimi",
    icon: FiTruck,
    color: "#8b5cf6"
  },
  {
    key: "diger",
    title: "Diğer",
    desc: "Hizmet, serbest meslek veya farklı bir sektör",
    icon: FiTool,
    color: "#f59e0b"
  }
];

const PRIMARY_NEEDS = [
  {
    key: "barkod_stok",
    title: "Barkodlu hızlı stok ve varyant takibi",
    desc: "Barkod okutma, beden/renk varyantları ve kritik stok alarmları",
    icon: FiTag,
    color: "#3b82f6"
  },
  {
    key: "cari_kasa",
    title: "Cari, fatura ve kasa takibi",
    desc: "Müşteri veresiye borçları, PDF fatura ve anlık gelir/gider",
    icon: FiFileText,
    color: "#10b981"
  },
  {
    key: "uretim_izleme",
    title: "Üretim / imalat süreçlerini izleme",
    desc: "Hammadde girişi, ürün maliyeti ve iş/reçete süreçleri",
    icon: FiCpu,
    color: "#8b5cf6"
  },
  {
    key: "depo_sube",
    title: "Çoklu şube / depo yönetimi",
    desc: "Depolar arası transfer, raf düzeni ve toplu envanter dökümü",
    icon: FiBox,
    color: "#f59e0b"
  }
];

export default function OnboardingSurvey({ onCompleted = null }) {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1); // 1 = Sektör, 2 = Öncelikli İhtiyaç
  const [selectedSector, setSelectedSector] = useState("perakende");
  const [customSector, setCustomSector] = useState("");
  const [selectedNeed, setSelectedNeed] = useState("barkod_stok");
  const [saving, setSaving] = useState(false);

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleFinish = async (isSkipped = false) => {
    if (saving) return;
    setSaving(true);

    try {
      const sectorObj = SECTORS.find(s => s.key === selectedSector);
      const needObj = PRIMARY_NEEDS.find(n => n.key === selectedNeed);

      const sectorTitle = isSkipped ? "Genel" : (selectedSector === "diger" && customSector.trim() ? customSector.trim() : (sectorObj?.title || "Genel"));
      const needTitle = isSkipped ? "Genel Stok & Satış" : (needObj?.title || "Genel Stok & Satış");

      const payload = {
        sector: sectorTitle,
        sectorKey: isSkipped ? "genel" : selectedSector,
        customSector: customSector.trim(),
        primaryNeed: needTitle,
        needKey: isSkipped ? "genel" : selectedNeed,
        onboardingCompleted: true,
        onboardingSkipped: Boolean(isSkipped),
        onboardingCompletedAt: new Date().toISOString()
      };

      if (user?.uid) {
        try {
          await saveSurveyResponse(payload, user.uid);
        } catch (saveErr) {
          console.warn("Anket kaydı hatası:", saveErr);
        }
      }

      // 0ms instant local store update
      updateLocalStorageDirectly((store) => {
        return {
          ...store,
          profile: {
            ...(store.profile || {}),
            ...payload
          }
        };
      });

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
      // Fallback navigate to dashboard anyway so user isn't stuck
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onb-container" role="main">
      <div className="onb-card">
        
        {/* HEADER SECTION */}
        <div className="onb-header">
          <div className="onb-header-left">
            <div className="onb-step-badge">
              <FiZap className="shrink-0" />
              <span>Soru {currentStep} / 2 • {currentStep === 1 ? "Sektör Belirleme" : "Öncelikli İhtiyaç"}</span>
            </div>
            <h2 className="onb-title">
              {currentStep === 1 ? "İşletmenizin ana faaliyet alanı nedir?" : "StokPro'da ilk çözmek istediğiniz problem nedir?"}
            </h2>
            <p className="onb-subtitle">
              {currentStep === 1 
                ? "Size en uygun deneyimi hazırlayalım (Sektörünüze özel terim ve kategoriler)" 
                : "Panelinizdeki hızlı butonları ve analizleri bu hedefinize göre öne çıkaracağız"}
            </p>
          </div>

          <button 
            type="button" 
            onClick={() => handleFinish(true)} 
            className="onb-skip-btn-top"
            disabled={saving}
            title="Soruları atla ve doğrudan panele geç"
          >
            <span>Şimdilik Geç</span>
            <FiSkipForward size={14} />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="onb-progress-bar-bg">
          <div 
            className="onb-progress-bar-fill" 
            style={{ width: currentStep === 1 ? '50%' : '100%', transition: 'width 0.3s ease-in-out' }} 
          />
        </div>

        <div className="onb-form-body">
          
          {/* STEP 1: SEKTÖR SEÇİMİ */}
          {currentStep === 1 && (
            <div className="onb-section animate-fadeIn">
              <div className="onb-grid-options">
                {SECTORS.map((s) => {
                  const Icon = s.icon;
                  const isSelected = selectedSector === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSelectedSector(s.key)}
                      className={`onb-option-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="onb-option-top">
                        <div 
                          className="onb-option-icon-box"
                          style={{ color: s.color, backgroundColor: `${s.color}15` }}
                        >
                          <Icon size={22} />
                        </div>
                        
                        <div className="onb-option-check">
                          {isSelected && <FiCheck size={14} className="text-white" />}
                        </div>
                      </div>

                      <div className="onb-option-info">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="onb-opt-title">{s.title}</strong>
                          {s.badge && (
                            <span className="onb-mini-badge">{s.badge}</span>
                          )}
                        </div>
                        <p className="onb-opt-desc">{s.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* IF "DİĞER" IS SELECTED: OPTIONAL CUSTOM SECTOR INPUT */}
              {selectedSector === "diger" && (
                <div className="onb-custom-input-wrap animate-fadeIn">
                  <label className="onb-custom-label">Faaliyet Alanınızı Belirtin (Opsiyonel):</label>
                  <input
                    type="text"
                    value={customSector}
                    onChange={(e) => setCustomSector(e.target.value)}
                    placeholder="Örn: Oto Yedek Parça, Mobilya, E-ticaret..."
                    className="modern-input onb-custom-input"
                    maxLength={50}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ÖNCELİKLİ İHTİYAÇ / ACI NOKTASI */}
          {currentStep === 2 && (
            <div className="onb-section animate-fadeIn">
              <div className="onb-grid-options">
                {PRIMARY_NEEDS.map((n) => {
                  const Icon = n.icon;
                  const isSelected = selectedNeed === n.key;
                  return (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => setSelectedNeed(n.key)}
                      className={`onb-option-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="onb-option-top">
                        <div 
                          className="onb-option-icon-box"
                          style={{ color: n.color, backgroundColor: `${n.color}15` }}
                        >
                          <Icon size={22} />
                        </div>
                        
                        <div className="onb-option-check">
                          {isSelected && <FiCheck size={14} className="text-white" />}
                        </div>
                      </div>

                      <div className="onb-option-info">
                        <strong className="onb-opt-title">{n.title}</strong>
                        <p className="onb-opt-desc">{n.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="onb-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="tbl-btn secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 800, gap: '6px' }}
                disabled={saving}
              >
                <FiArrowLeft size={16} /> Geri
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="onb-skip-btn-bottom"
                disabled={saving}
              >
                Şimdilik Geç (Varsayılan Kurulum)
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="modern-btn primary onb-submit-btn"
              >
                <span>Sonraki Soruya Geç</span>
                <FiArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(false)}
                className="modern-btn primary onb-submit-btn"
                disabled={saving}
              >
                <span>{saving ? "Hazırlanıyor..." : "Deneyimi Başlat"}</span>
                <FiArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
