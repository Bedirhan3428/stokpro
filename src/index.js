import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  
    <App />
  
);

// --- PWA KAYDI (GARANTİ YÖNTEM) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // public/service-worker.js dosyasını kaydediyoruz
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('StokPro PWA: Service Worker başarıyla kaydedildi: ', registration.scope);
      })
      .catch((err) => {
        console.log('StokPro PWA: Service Worker kaydı başarısız: ', err);
      });
  });
}