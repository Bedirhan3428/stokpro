"use client";

import React from "react";
import Link from "next/link";
import { FiPackage, FiHome, FiSearch, FiZap } from "react-icons/fi";
import { GiCardboardBox } from "react-icons/gi";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-5 relative overflow-hidden font-sans">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <GiCardboardBox size={500} className="text-blue-500/20 opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-8xl font-black mb-4 tracking-tight text-blue-500 drop-shadow-lg">404</h1>
        <h2 className="text-3xl font-bold mb-3">Aradığınız Sayfa Bulunamadı</h2>
        <p className="text-slate-400 mb-6 max-w-md">Üzgünüz, aradığınız sayfa mevcut değil.</p>
        <Link
          href="/"
          className="text-white bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center font-medium shadow-lg shadow-blue-500/25"
          style={{ width: "200px", height: "50px" }}
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
