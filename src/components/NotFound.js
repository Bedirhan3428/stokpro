"use client";

import React from "react";
import Link from "next/link";
import { FiPackage, FiHome, FiSearch, FiZap } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-5 relative overflow-hidden font-sans">
      
      {/* ARKAPLANDA SAYDAM BÜYÜK BOŞ KUTU İKONU */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-slate-700/20 dark:text-slate-800/20 animate-pulse"
        style={{ fontSize: 'clamp(280px, 45vw, 520px)', opacity: 0.08, zIndex: 0 }}
      >
        <FiPackage />
      </div>

      {/* 404 KART İÇERİĞİ */}
      <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 sm:p-10 shadow-2xl text-center flex flex-col items-center gap-6">
        
        {/* ÜST MARKA BADGE */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-900/60 text-xs font-extrabold tracking-wider">
          <FiZap size={14} /> STOKPRO® HATA 404
        </div>

        {/* ORTADAKİ KUTU VE 404 RAKAMI */}
        <div className="flex flex-col items-center relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-3xl mb-2 shadow-lg shadow-blue-500/10">
            <FiPackage />
          </div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* METİNLER */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Aradığınız Sayfa veya Stok Bulunamadı
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            "İstediğiniz sayfa silinmiş, ismi değiştirilmiş veya depomuzda hiç var olmamış olabilir."
          </p>
        </div>

        {/* BUTONLAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
          <Link 
            href="/"
            className="modern-btn primary w-full justify-center"
            style={{ padding: '12px 20px', fontSize: '0.9rem', fontWeight: 800 }}
          >
            <FiHome size={16} /> Ana Sayfaya Dön
          </Link>

          <Link 
            href="/products"
            className="modern-btn secondary w-full justify-center"
            style={{ padding: '12px 20px', fontSize: '0.9rem', fontWeight: 800 }}
          >
            <FiSearch size={16} /> Stokları İncele
          </Link>
        </div>

        <div className="text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-800/80 w-full">
          StokPro Ticari Stok Takip & Ön Muhasebe Sistemleri
        </div>

      </div>

    </div>
  );
}
