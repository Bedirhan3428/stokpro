"use client";

import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

export default function Bildirim({ note, onClose }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!note) return;
    setClosing(false);
    
    const timeoutMs = note.duration || (note.actionText ? 7000 : 4000);
    
    const animTimer = setTimeout(() => {
      setClosing(true);
    }, Math.max(1000, timeoutMs - 350));

    const closeTimer = setTimeout(() => {
      if (onClose) onClose();
    }, timeoutMs);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(closeTimer);
    };
  }, [note, note?.renewedAt, onClose]);

  if (!note) return null;

  const type = note.type || "info";
  
  const icon = type === "success" ? (
    <div style={{ background: 'var(--success-bg)', color: 'var(--success)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FiCheckCircle size={24} />
    </div>
  ) : type === "error" ? (
    <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FiAlertCircle size={24} />
    </div>
  ) : type === "warning" ? (
    <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FiAlertTriangle size={24} />
    </div>
  ) : (
    <div style={{ background: 'var(--primary-bg)', color: 'var(--primary)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FiInfo size={24} />
    </div>
  );

  const badgeBorder = type === "success" ? "border-l-4 border-l-emerald-500"
    : type === "error" ? "border-l-4 border-l-red-500"
    : type === "warning" ? "border-l-4 border-l-amber-500"
    : "border-l-4 border-l-blue-500";

  const progressBg = type === "success" ? "#10b981"
    : type === "error" ? "#ef4444"
    : type === "warning" ? "#f59e0b"
    : "#3b82f6";

  const timeoutMs = note.duration || (note.actionText ? 7000 : 4000);
  const timerKey = note.renewedAt || note.id || note.message;

  return (
    <div className="toast-container">
      <div className={`toast-card ${badgeBorder} ${closing ? "toast-closing" : ""}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          {icon}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h5 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.2px' }}>
              {note.title || "Sistem Bildirimi"}
            </h5>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0, fontWeight: 500 }}>
              {note.message}
            </p>

            {/* BUTON MESAJIN ALTINDA YER ALIR */}
            {note.actionText && note.onAction && (
              <button 
                onClick={() => {
                  note.onAction();
                  if (onClose) onClose();
                }} 
                className="modern-btn primary"
                style={{ 
                  marginTop: '8px', 
                  padding: '6px 14px', 
                  fontSize: '0.8rem', 
                  fontWeight: 900, 
                  width: 'fit-content', 
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' 
                }}
              >
                {note.actionText}
              </button>
            )}
          </div>

          {onClose && (
            <button 
              onClick={() => { setClosing(true); setTimeout(onClose, 350); }}
              className="close-btn" 
              style={{ fontSize: '1.2rem', padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-light)', marginTop: '-2px' }}
            >
              <FiX />
            </button>
          )}
        </div>

        {/* HATA/BİLDİRİM GÜNCELLENDİĞİNDE ZAMAN ÇUBUĞUNU SIFIRLAYIP YENİDEN BAŞLAT */}
        <div 
          key={timerKey}
          className="toast-timer-bar" 
          style={{ background: progressBg, animationDuration: `${timeoutMs}ms` }}
        />
      </div>
    </div>
  );
}
